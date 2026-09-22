import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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

    list: adminProcedure.query(async () => db.getAllOrders()),
    stats: adminProcedure.query(async () => db.getOrderStats()),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          estado: z.enum(["pendiente", "en_camino", "contactado", "completado", "cancelado"]),
        })
      )
      .mutation(async ({ input }) => db.updateOrderStatus(input.id, input.estado)),
  }),
});

export type AppRouter = typeof appRouter;
