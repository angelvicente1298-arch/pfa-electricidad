import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, orders, InsertOrder } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not connected");
  }
  const [result] = await db.insert(orders).values(data);
  return result;
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(id: number, estado: "pendiente" | "en_camino" | "contactado" | "completado" | "cancelado") {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  await db.update(orders).set({ estado }).where(eq(orders.id, id));
  return { success: true };
}

export async function getOrderStats() {
  const db = await getDb();
  if (!db) {
    return { total: 0, pendientes: 0, contactados: 0, completados: 0, porServicio: [], porComuna: [] };
  }

  const all = await db.select().from(orders);
  const total = all.length;
  const pendientes = all.filter((o) => o.estado === "pendiente").length;
  const contactados = all.filter((o) => o.estado === "contactado" || o.estado === "en_camino").length;
  const completados = all.filter((o) => o.estado === "completado").length;

  const countByService: Record<string, number> = {};
  const countByComuna: Record<string, number> = {};

  all.forEach((o) => {
    countByService[o.servicio] = (countByService[o.servicio] || 0) + 1;
    countByComuna[o.comuna] = (countByComuna[o.comuna] || 0) + 1;
  });

  const porServicio = Object.entries(countByService).map(([servicio, count]) => ({ servicio, count }));
  const porComuna = Object.entries(countByComuna).map(([comuna, count]) => ({ comuna, count }));

  return { total, pendientes, contactados, completados, porServicio, porComuna };
}
