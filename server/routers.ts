import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import type { TrpcContext } from "./_core/context";

function timingSafeEqualStrings(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const ADMIN_SESSION_COOKIE = "pfa_admin_session";
const ADMIN_SESSION_TTL_MS = 30 * 60 * 1000;
const ADMIN_RATE_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_MAX_FAILED_ATTEMPTS = 5;
const failedAdminAttempts = new Map<string, { count: number; startedAt: number; blockedUntil?: number }>();
const reviewSubmissions = new Map<string, { count: number; startedAt: number }>();
const orderSubmissions = new Map<string, { count: number; startedAt: number }>();
const assistantRequests = new Map<string, { count: number; startedAt: number }>();

function clientAddress(ctx: TrpcContext) {
  return ctx.req.ip || "unknown";
}

function checkAdminRateLimit(ctx: TrpcContext) {
  const now = Date.now();
  const key = clientAddress(ctx);
  const attempt = failedAdminAttempts.get(key);
  if (!attempt) return;
  if (attempt.blockedUntil && attempt.blockedUntil > now) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Demasiados intentos. Prueba nuevamente más tarde." });
  }
  if (now - attempt.startedAt >= ADMIN_RATE_WINDOW_MS) failedAdminAttempts.delete(key);
}

function registerAdminFailure(ctx: TrpcContext) {
  const now = Date.now();
  const key = clientAddress(ctx);
  const previous = failedAdminAttempts.get(key);
  const attempt = previous && now - previous.startedAt < ADMIN_RATE_WINDOW_MS
    ? previous
    : { count: 0, startedAt: now };
  attempt.count += 1;
  if (attempt.count >= ADMIN_MAX_FAILED_ATTEMPTS) attempt.blockedUntil = now + ADMIN_RATE_WINDOW_MS;
  failedAdminAttempts.set(key, attempt);
}

function clearAdminFailures(ctx: TrpcContext) {
  failedAdminAttempts.delete(clientAddress(ctx));
}

function signAdminSession(payload: string) {
  return crypto.createHmac("sha256", ENV.cookieSecret).update(payload).digest("base64url");
}

function createAdminSession(openId: string) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + ADMIN_SESSION_TTL_MS, sub: openId, nonce: crypto.randomBytes(24).toString("hex") })).toString("base64url");
  return `${payload}.${signAdminSession(payload)}`;
}

function readCookie(ctx: TrpcContext, name: string) {
  const header = ctx.req.headers.cookie || "";
  const pair = header.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  if (!pair) return undefined;
  try {
    return decodeURIComponent(pair.slice(name.length + 1));
  } catch {
    return undefined;
  }
}

function setAdminSessionCookie(ctx: TrpcContext, token: string, maxAge: number) {
  const forwardedProto = ctx.req.headers["x-forwarded-proto"];
  const secure = ctx.req.protocol === "https" || forwardedProto === "https" || (Array.isArray(forwardedProto) && forwardedProto.includes("https"));
  const attributes = [`${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`, "Path=/", `Max-Age=${maxAge}`, "HttpOnly", "SameSite=Lax"];
  if (secure) attributes.push("Secure");
  ctx.res.setHeader("Set-Cookie", attributes.join("; "));
}

function hasValidAdminSession(ctx: TrpcContext) {
  const token = readCookie(ctx, ADMIN_SESSION_COOKIE);
  if (!token || !ENV.cookieSecret) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !timingSafeEqualStrings(signature, signAdminSession(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number; sub?: string; nonce?: string };
    return Boolean(data.exp && data.exp > Date.now() && data.sub === ctx.user?.openId && data.nonce);
  } catch {
    return false;
  }
}

function requireAdminSession(ctx: TrpcContext) {
  if (!hasValidAdminSession(ctx)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión del panel expirada. Ingresa nuevamente." });
}

function checkReviewSubmissionRate(ctx: TrpcContext) {
  const now = Date.now();
  const key = clientAddress(ctx);
  const previous = reviewSubmissions.get(key);
  if (!previous || now - previous.startedAt >= 30 * 60 * 1000) {
    reviewSubmissions.set(key, { count: 0, startedAt: now });
    return;
  }
  if (previous.count >= 3) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Ya recibimos varias reseñas desde este dispositivo. Intenta más tarde." });
  }
}

function recordReviewSubmission(ctx: TrpcContext) {
  const key = clientAddress(ctx);
  const previous = reviewSubmissions.get(key) || { count: 0, startedAt: Date.now() };
  previous.count += 1;
  reviewSubmissions.set(key, previous);
}

function checkWindowRate(map: Map<string, { count: number; startedAt: number }>, ctx: TrpcContext, max: number, windowMs: number, message: string) {
  const now = Date.now();
  const key = clientAddress(ctx);
  const previous = map.get(key);
  if (!previous || now - previous.startedAt >= windowMs) {
    map.set(key, { count: 0, startedAt: now });
    return;
  }
  if (previous.count >= max) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message });
}

function recordWindowRate(map: Map<string, { count: number; startedAt: number }>, ctx: TrpcContext) {
  const key = clientAddress(ctx);
  const previous = map.get(key) || { count: 0, startedAt: Date.now() };
  previous.count += 1;
  map.set(key, previous);
}

const DESTINATION_PHONE = "+56 9 6193 5547";
const DESTINATION_DIGITS = "56961935547";

function normalizeChilePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("56")) return `+${digits}`;
  if (digits.startsWith("0")) return `+56${digits.slice(1)}`;
  return `+56${digits}`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  assistant: router({
    chat: publicProcedure
      .input(
        z.object({
          message: z.string().trim().min(1).max(1200),
          history: z.array(z.object({ sender: z.enum(["bot", "user"]), text: z.string().max(1200) })).max(10).default([]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        checkWindowRate(assistantRequests, ctx, 20, 10 * 60 * 1000, "Demasiadas consultas. Intenta nuevamente en unos minutos.");
        recordWindowRate(assistantRequests, ctx);
        const systemPrompt = `Eres el asistente virtual oficial de PFA Electricidad SpA, una empresa de servicios eléctricos en Santiago de Chile. Atiendes 24/7 en español chileno, con tono profesional, claro, cordial y práctico.

INFORMACIÓN VERIFICADA DE PFA:
- Teléfono y WhatsApp oficial: +56 9 6193 5547.
- Cobertura: Santiago y Región Metropolitana, incluyendo Las Condes, Vitacura, Lo Barnechea, Providencia, Ñuñoa, Santiago Centro, La Reina, Peñalolén, Macul, San Miguel, Maipú, La Florida, Huechuraba, Colina/Chicureo y Lampa.
- Servicios: instalaciones eléctricas residenciales, comerciales e industriales; reparación de fallas y emergencias; renovación y normalización de tableros; certificación SEC y declaración TE1; instalación de cargadores EV/Wallbox; iluminación LED; diagnóstico y visitas técnicas.
- La empresa entrega presupuestos claros después de conocer el alcance o revisar el lugar. Nunca inventes precios, plazos exactos, disponibilidad de técnicos ni certificaciones específicas.
- Para humo, chispas, olor a quemado o riesgo de incendio: indica cortar el automático general si es seguro hacerlo, alejarse del peligro y llamar inmediatamente al +56 9 6193 5547 o a emergencias. No recomiendes manipular cables energizados.
- Si el cliente quiere contratar, pide nombre, comuna, teléfono y una descripción de qué pasó; luego invítalo a usar el formulario o WhatsApp.
- Si la pregunta no tiene relación con electricidad o PFA, dilo brevemente y vuelve a ofrecer ayuda con servicios eléctricos.
- Responde de forma breve, normalmente en 2 a 5 frases. No uses emojis ni caracteres especiales decorativos que puedan romperse en WhatsApp. Puedes usar listas simples con guiones.`;

        const historyMessages = input.history.map((item) => ({
          role: item.sender === "user" ? "user" as const : "assistant" as const,
          content: item.text,
        }));

        try {
          const response = await invokeLLM({
            model: "gemini-3-flash-preview",
            maxTokens: 800,
            messages: [
              { role: "system", content: systemPrompt },
              ...historyMessages,
              { role: "user", content: input.message },
            ],
          });
          const content = response.choices[0]?.message?.content;
          const reply = typeof content === "string"
            ? content
            : Array.isArray(content)
              ? content.filter((part): part is { type: "text"; text: string } => part.type === "text").map((part) => part.text).join("\n")
              : "Puedo ayudarte con servicios eléctricos, urgencias y certificación SEC. Si necesitas atención inmediata, escríbenos por WhatsApp al +56 9 6193 5547.";
          return { reply: reply.trim() };
        } catch (error) {
          console.error("[Assistant] LLM unavailable:", error);
          return { reply: "Estoy disponible 24/7 para orientarte. Para una respuesta inmediata, llama o escribe por WhatsApp al +56 9 6193 5547." };
        }
      }),
  }),

  orders: router({
    create: publicProcedure
      .input(
        z.object({
          nombre: z.string().trim().min(2).max(100),
          telefono: z.string().trim().min(6).max(32),
          comuna: z.string().trim().min(2).max(100),
          servicio: z.string().trim().min(2).max(150),
          tipoPropiedad: z.string().trim().max(64).optional(),
          urgencia: z.string().trim().max(32).optional(),
          mensaje: z.string().trim().max(2000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        checkWindowRate(orderSubmissions, ctx, 10, 15 * 60 * 1000, "Demasiadas solicitudes desde este dispositivo. Intenta nuevamente más tarde.");
        const normalizedPhone = normalizeChilePhone(input.telefono);
        const order = await db.createOrder({
          nombre: input.nombre,
          telefono: normalizedPhone,
          comuna: input.comuna,
          servicio: input.servicio,
          tipoPropiedad: input.tipoPropiedad || "Residencial",
          urgencia: input.urgencia || "Normal",
          mensaje: input.mensaje || "",
          estado: "pendiente",
          whatsappDestino: DESTINATION_PHONE,
        });

        // Plain-text message avoids unsupported emoji glyphs and remains readable on every phone.
        const message = [
          "NUEVO PEDIDO DE SERVICIO",
          "PFA ELECTRICIDAD SPA",
          "------------------------------",
          `Cliente: ${input.nombre}`,
          `Telefono: ${normalizedPhone}`,
          `Comuna: ${input.comuna}`,
          `Servicio requerido: ${input.servicio}`,
          `Tipo de propiedad: ${input.tipoPropiedad || "Residencial"}`,
          `Urgencia: ${input.urgencia || "Normal"}`,
          `Detalle: ${input.mensaje || "Sin detalle adicional"}`,
        ].join("\n");

        const whatsappUrl = `https://wa.me/${DESTINATION_DIGITS}?text=${encodeURIComponent(message)}`;
        recordWindowRate(orderSubmissions, ctx);

        return {
          success: true,
          whatsappUrl,
          order,
        };
      }),

    verifyPassword: adminProcedure
      .input(z.object({ password: z.string().min(1).max(200) }))
      .mutation(({ ctx, input }) => {
        checkAdminRateLimit(ctx);
        const configured = ENV.adminPanelPassword;
        if (!configured) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Contraseña no configurada en el servidor" });
        }
        const valid = timingSafeEqualStrings(input.password, configured);
        if (!valid) {
          registerAdminFailure(ctx);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña incorrecta" });
        }
        clearAdminFailures(ctx);
        setAdminSessionCookie(ctx, createAdminSession(ctx.user.openId), Math.floor(ADMIN_SESSION_TTL_MS / 1000));
        return { valid: true } as const;
      }),

    logout: adminProcedure.mutation(({ ctx }) => {
      setAdminSessionCookie(ctx, "", 0);
      return { success: true } as const;
    }),

    list: adminProcedure.query(async ({ ctx }) => {
        requireAdminSession(ctx);
        return db.getAllOrders();
      }),

    stats: adminProcedure.query(async ({ ctx }) => {
        requireAdminSession(ctx);
        return db.getOrderStats();
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          estado: z.enum(["pendiente", "en_camino", "contactado", "completado", "cancelado"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        requireAdminSession(ctx);
        return db.updateOrderStatus(input.id, input.estado);
      }),
  }),

  reviews: router({
    listApproved: publicProcedure.query(async () => db.getApprovedReviews()),

    submit: publicProcedure
      .input(
        z.object({
          nombre: z.string().trim().min(2).max(100),
          comuna: z.string().trim().max(100).optional(),
          servicio: z.string().trim().max(150).optional(),
          calificacion: z.number().int().min(1).max(5),
          comentario: z.string().trim().min(5).max(1000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        checkReviewSubmissionRate(ctx);
        await db.createReview({
          nombre: input.nombre,
          comuna: input.comuna || "Santiago",
          servicio: input.servicio || "Servicio Eléctrico",
          calificacion: input.calificacion,
          comentario: input.comentario,
          estado: "pendiente",
        });
        recordReviewSubmission(ctx);
        return { success: true, message: "Tu reseña fue recibida y quedará visible tras su aprobación." };
      }),

    listAll: adminProcedure.query(async ({ ctx }) => {
        requireAdminSession(ctx);
        return db.getAllReviews();
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          estado: z.enum(["pendiente", "aprobada", "rechazada"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        requireAdminSession(ctx);
        return db.updateReviewStatus(input.id, input.estado);
      }),
  }),
});

export type AppRouter = typeof appRouter;
