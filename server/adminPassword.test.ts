import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

function createAdminContext(): TrpcContext {
  const adminUser: User = {
    id: 1,
    openId: "test-admin",
    name: "Admin Test",
    email: "admin@pfa.cl",
    loginMethod: "test",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: adminUser,
    req: {} as any,
    res: {} as any,
  };
}

describe("admin panel password secret validation", () => {
  it("rejects invalid password attempt", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.orders.verifyPassword({ password: "wrong-password" })).rejects.toThrow();
  });

  it("accepts configured secret password and validates access", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const configuredSecret = process.env.ADMIN_PANEL_PASSWORD;
    expect(configuredSecret).toBeTruthy();

    const result = await caller.orders.verifyPassword({ password: configuredSecret! });
    expect(result.valid).toBe(true);

    const stats = await caller.orders.stats({ password: configuredSecret! });
    expect(stats).toHaveProperty("total");
  });
});
