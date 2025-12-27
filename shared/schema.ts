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
  coinbaseSymbol: text("coinbase_symbol").notNull().default("BTC-USD"),
  coinbaseBuyThreshold: numeric("coinbase_buy_threshold", { precision: 18, scale: 8 }).notNull().default("10"),
  coinbaseSellThreshold: numeric("coinbase_sell_threshold", { precision: 18, scale: 8 }).notNull().default("10"),
  coinbaseBuyKey: text("coinbase_buy_key").notNull().default("a"),
  coinbaseSellKey: text("coinbase_sell_key").notNull().default("b"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertConfigurationSchema = createInsertSchema(configurations).omit({ id: true }).extend({
  buyThreshold: z.union([z.string(), z.number()]).pipe(z.coerce.string()),
  sellThreshold: z.union([z.string(), z.number()]).pipe(z.coerce.string()),
  coinbaseBuyThreshold: z.union([z.string(), z.number()]).pipe(z.coerce.string()),
  coinbaseSellThreshold: z.union([z.string(), z.number()]).pipe(z.coerce.string()),
});

export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type UpdateConfiguration = Partial<InsertConfiguration>;
