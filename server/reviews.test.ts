import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return { user: null, req: {} as any, res: {} as any };
}

describe("reviews", () => {
  it("rejects incomplete public reviews before touching the database", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.reviews.submit({
      nombre: "A",
      comuna: "Santiago",
      servicio: "Servicio eléctrico",
      calificacion: 5,
      comentario: "ok",
    })).rejects.toThrow();
  });

  it("exposes only the approved reviews query to the public", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const reviews = await caller.reviews.listApproved();
    expect(Array.isArray(reviews)).toBe(true);
    expect(reviews.every((review) => review.estado === "aprobada")).toBe(true);
  });
});
