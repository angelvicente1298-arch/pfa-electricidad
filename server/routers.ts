import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
        const order = await db.createOrder({
          nombre: input.nombre,
          telefono: input.telefono,
          comuna: input.comuna,
          servicio: input.servicio,
          tipoPropiedad: input.tipoPropiedad || "Residencial",
          urgencia: input.urgencia || "Normal",
          mensaje: input.mensaje || "",
          estado: "pendiente",
          whatsappDestino: "+56 9 6193 5547",
        });

        // Generate clean WhatsApp link directed to +56 9 6193 5547
        const text = `⚡ *NUEVO PEDIDO DE SERVICIO PFA ELECTRICIDAD SPA*\n\n` +
          `👤 *Cliente:* ${input.nombre}\n` +
          `📞 *Teléfono:* ${input.telefono}\n` +
          `📍 *Comuna:* ${input.comuna}\n` +
          `🛠️ *Servicio Requerido:* ${input.servicio}\n` +
          `🏠 *Tipo Propiedad:* ${input.tipoPropiedad || "Residencial"}\n` +
          `⏱️ *Urgencia:* ${input.urgencia || "Normal"}\n` +
          `📝 *Detalle:* ${input.mensaje || "Sin detalle adicional"}\n\n` +
          `_Registrado en el panel PFA Electricidad SpA_`;

        const whatsappUrl = `https://wa.me/56961935547?text=${encodeURIComponent(text)}`;

        return {
          success: true,
          whatsappUrl,
          order,
        };
      }),

    list: publicProcedure.query(async () => {
      return db.getAllOrders();
    }),

    stats: publicProcedure.query(async () => {
      return db.getOrderStats();
    }),

    updateStatus: publicProcedure
      .input(
        z.object({
          id: z.number(),
          estado: z.enum(["pendiente", "en_camino", "contactado", "completado", "cancelado"]),
        })
      )
      .mutation(async ({ input }) => {
        return db.updateOrderStatus(input.id, input.estado);
      }),
  }),
});

export type AppRouter = typeof appRouter;
