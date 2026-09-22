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

function timingSafeEqualStrings(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
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
          message: z.string().trim().min(1).max(2000),
          history: z.array(z.object({ sender: z.enum(["bot", "user"]), text: z.string().max(2000) })).max(12).default([]),
        })
      )
      .mutation(async ({ input }) => {
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
          nombre: z.string().min(2),
          telefono: z.string().min(6),
          comuna: z.string().min(2),
          servicio: z.string().min(2),
          tipoPropiedad: z.string().optional(),
          urgencia: z.string().optional(),
          mensaje: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
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
          "------------------------------",
          "Solicitud registrada en el Panel Admin de PFA Electricidad.",
          `Numero de recepcion: ${DESTINATION_PHONE}`,
        ].join("\n");

        const whatsappUrl = `https://wa.me/${DESTINATION_DIGITS}?text=${encodeURIComponent(message)}`;

        return {
          success: true,
          whatsappUrl,
          order,
        };
      }),

    verifyPassword: adminProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        const configured = ENV.adminPanelPassword;
        if (!configured) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Contraseña no configurada en el servidor" });
        }
        const valid = timingSafeEqualStrings(input.password, configured);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña incorrecta" });
        }
        return { valid: true };
      }),

    list: adminProcedure
      .input(z.object({ password: z.string() }))
      .query(async ({ input }) => {
        const configured = ENV.adminPanelPassword;
        if (!configured || !timingSafeEqualStrings(input.password, configured)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña del panel requerida o incorrecta" });
        }
        return db.getAllOrders();
      }),

    stats: adminProcedure
      .input(z.object({ password: z.string() }))
      .query(async ({ input }) => {
        const configured = ENV.adminPanelPassword;
        if (!configured || !timingSafeEqualStrings(input.password, configured)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña del panel requerida o incorrecta" });
        }
        return db.getOrderStats();
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          estado: z.enum(["pendiente", "en_camino", "contactado", "completado", "cancelado"]),
          password: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const configured = ENV.adminPanelPassword;
        if (!configured || !timingSafeEqualStrings(input.password, configured)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña del panel requerida o incorrecta" });
        }
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
      .mutation(async ({ input }) => {
        await db.createReview({
          nombre: input.nombre,
          comuna: input.comuna || "Santiago",
          servicio: input.servicio || "Servicio Eléctrico",
          calificacion: input.calificacion,
          comentario: input.comentario,
          estado: "pendiente",
        });
        return { success: true, message: "Tu reseña fue recibida y quedará visible tras su aprobación." };
      }),

    listAll: adminProcedure
      .input(z.object({ password: z.string() }))
      .query(async ({ input }) => {
        const configured = ENV.adminPanelPassword;
        if (!configured || !timingSafeEqualStrings(input.password, configured)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña del panel requerida o incorrecta" });
        }
        return db.getAllReviews();
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          estado: z.enum(["pendiente", "aprobada", "rechazada"]),
          password: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const configured = ENV.adminPanelPassword;
        if (!configured || !timingSafeEqualStrings(input.password, configured)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña del panel requerida o incorrecta" });
        }
        return db.updateReviewStatus(input.id, input.estado);
      }),
  }),
});

export type AppRouter = typeof appRouter;
