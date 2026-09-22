import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 191 }).notNull(),
  telefono: varchar("telefono", { length: 64 }).notNull(),
  comuna: varchar("comuna", { length: 100 }).notNull(),
  servicio: varchar("servicio", { length: 150 }).notNull(),
  tipoPropiedad: varchar("tipoPropiedad", { length: 64 }).default("Residencial"),
  urgencia: varchar("urgencia", { length: 32 }).default("Normal"),
  mensaje: text("mensaje"),
  estado: mysqlEnum("estado", ["pendiente", "en_camino", "contactado", "completado", "cancelado"]).default("pendiente").notNull(),
  whatsappDestino: varchar("whatsappDestino", { length: 64 }).default("+56 9 6193 5547").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
