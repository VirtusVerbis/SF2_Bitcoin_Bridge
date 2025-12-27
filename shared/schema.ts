import { pgTable, text, serial, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().default("btcusdt"),
  buyThreshold: numeric("buy_threshold", { precision: 18, scale: 8 }).notNull().default("10"),
  sellThreshold: numeric("sell_threshold", { precision: 18, scale: 8 }).notNull().default("10"),
  buyKey: text("buy_key").notNull().default("x"),
  sellKey: text("sell_key").notNull().default("y"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertConfigurationSchema = createInsertSchema(configurations).omit({ id: true }).extend({
  buyThreshold: z.union([z.string(), z.number()]).pipe(z.coerce.string()),
  sellThreshold: z.union([z.string(), z.number()]).pipe(z.coerce.string()),
});

export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type UpdateConfiguration = Partial<InsertConfiguration>;
