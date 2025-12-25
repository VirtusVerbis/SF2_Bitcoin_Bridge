import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().default("btcusdt"),
  buyThreshold: integer("buy_threshold").notNull().default(100),
  sellThreshold: integer("sell_threshold").notNull().default(100),
  buyKey: text("buy_key").notNull().default("x"),
  sellKey: text("sell_key").notNull().default("y"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertConfigurationSchema = createInsertSchema(configurations).omit({ id: true });

export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type UpdateConfiguration = Partial<InsertConfiguration>;
