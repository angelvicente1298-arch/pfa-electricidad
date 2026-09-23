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
    req: { headers: {}, protocol: "https", ip: "test-admin-ip" } as any,
    res: { setHeader: () => undefined } as any,
  };
}

describe("admin panel secure session", () => {
  it("denies panel procedures to a signed-in user without the admin role", async () => {
    const context = createAdminContext();
    context.user = { ...context.user!, role: "user" };
    const caller = appRouter.createCaller(context);

    await expect(caller.orders.verifyPassword({ password: "anything" })).rejects.toThrow("required permission");
    await expect(caller.orders.stats()).rejects.toThrow("required permission");
  });

  it("rejects invalid password attempt", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.orders.verifyPassword({ password: "wrong-password" })).rejects.toThrow("Contraseña incorrecta");
  });

  it("rejects a missing or forged admin session", async () => {
    const context = createAdminContext();
    context.req.headers.cookie = "pfa_admin_session=forged.invalid";
    const caller = appRouter.createCaller(context);

    await expect(caller.orders.stats()).rejects.toThrow("Sesión del panel expirada");
  });

  it("creates an HttpOnly session and reads protected data without a password input", async () => {
    const ctx = createAdminContext();
    let setCookie = "";
    ctx.res = {
      setHeader: (name: string, value: string) => {
        if (name.toLowerCase() === "set-cookie") setCookie = value;
      },
    } as any;
    const caller = appRouter.createCaller(ctx);
    const configuredSecret = process.env.ADMIN_PANEL_PASSWORD;
    expect(configuredSecret).toBeTruthy();

    const result = await caller.orders.verifyPassword({ password: configuredSecret! });
    expect(result.valid).toBe(true);
    expect(setCookie).toContain("pfa_admin_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Secure");

    (ctx.req as any).headers.cookie = setCookie;
    const stats = await caller.orders.stats();
    expect(stats).toHaveProperty("total");
  });
});
