import { pgTable, text, serial, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().default("btcusdt"),
  isActive: boolean("is_active").notNull().default(true),

  // Binance Buy (Punches)
  binanceBuyWeakMin: numeric("binance_buy_weak_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  binanceBuyWeakMax: numeric("binance_buy_weak_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  binanceBuyWeakKey: text("binance_buy_weak_key").notNull().default("x"),
  
  binanceBuyMedMin: numeric("binance_buy_med_min", { precision: 18, scale: 8 }).notNull().default("0.00010000"),
  binanceBuyMedMax: numeric("binance_buy_med_max", { precision: 18, scale: 8 }).notNull().default("0.00099999"),
  binanceBuyMedKey: text("binance_buy_med_key").notNull().default("c"),
  
  binanceBuyStrongMin: numeric("binance_buy_strong_min", { precision: 18, scale: 8 }).notNull().default("0.00100000"),
  binanceBuyStrongMax: numeric("binance_buy_strong_max", { precision: 18, scale: 8 }).notNull().default("0.00999999"),
  binanceBuyStrongKey: text("binance_buy_strong_key").notNull().default("v"),

  // Binance Sell (Kicks)
  binanceSellWeakMin: numeric("binance_sell_weak_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  binanceSellWeakMax: numeric("binance_sell_weak_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  binanceSellWeakKey: text("binance_sell_weak_key").notNull().default("y"),
  
  binanceSellMedMin: numeric("binance_sell_med_min", { precision: 18, scale: 8 }).notNull().default("0.00010000"),
  binanceSellMedMax: numeric("binance_sell_med_max", { precision: 18, scale: 8 }).notNull().default("0.00099999"),
  binanceSellMedKey: text("binance_sell_med_key").notNull().default("u"),
  
  binanceSellStrongMin: numeric("binance_sell_strong_min", { precision: 18, scale: 8 }).notNull().default("0.00100000"),
  binanceSellStrongMax: numeric("binance_sell_strong_max", { precision: 18, scale: 8 }).notNull().default("0.00999999"),
  binanceSellStrongKey: text("binance_sell_strong_key").notNull().default("i"),

  // Coinbase Buy (Punches)
  coinbaseSymbol: text("coinbase_symbol").notNull().default("BTC-USD"),
  coinbaseBuyWeakMin: numeric("coinbase_buy_weak_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  coinbaseBuyWeakMax: numeric("coinbase_buy_weak_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  coinbaseBuyWeakKey: text("coinbase_buy_weak_key").notNull().default("a"),
  
  coinbaseBuyMedMin: numeric("coinbase_buy_med_min", { precision: 18, scale: 8 }).notNull().default("0.00010000"),
  coinbaseBuyMedMax: numeric("coinbase_buy_med_max", { precision: 18, scale: 8 }).notNull().default("0.00099999"),
  coinbaseBuyMedKey: text("coinbase_buy_med_key").notNull().default("s"),
  
  coinbaseBuyStrongMin: numeric("coinbase_buy_strong_min", { precision: 18, scale: 8 }).notNull().default("0.00100000"),
  coinbaseBuyStrongMax: numeric("coinbase_buy_strong_max", { precision: 18, scale: 8 }).notNull().default("0.00999999"),
  coinbaseBuyStrongKey: text("coinbase_buy_strong_key").notNull().default("d"),

  // Coinbase Sell (Kicks)
  coinbaseSellWeakMin: numeric("coinbase_sell_weak_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  coinbaseSellWeakMax: numeric("coinbase_sell_weak_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  coinbaseSellWeakKey: text("coinbase_sell_weak_key").notNull().default("b"),
  
  coinbaseSellMedMin: numeric("coinbase_sell_med_min", { precision: 18, scale: 8 }).notNull().default("0.00010000"),
  coinbaseSellMedMax: numeric("coinbase_sell_med_max", { precision: 18, scale: 8 }).notNull().default("0.00099999"),
  coinbaseSellMedKey: text("coinbase_sell_med_key").notNull().default("n"),
  
  coinbaseSellStrongMin: numeric("coinbase_sell_strong_min", { precision: 18, scale: 8 }).notNull().default("0.00100000"),
  coinbaseSellStrongMax: numeric("coinbase_sell_strong_max", { precision: 18, scale: 8 }).notNull().default("0.00999999"),
  coinbaseSellStrongKey: text("coinbase_sell_strong_key").notNull().default("m"),

  // Binance Special Moves (P1)
  binanceSpecial1Min: numeric("binance_special1_min", { precision: 18, scale: 8 }).notNull().default("0.01000000"),
  binanceSpecial1Max: numeric("binance_special1_max", { precision: 18, scale: 8 }).notNull().default("0.09999999"),
  binanceSpecial1Signal: text("binance_special1_signal").notNull().default("buy"),
  binanceSpecial1Command: text("binance_special1_command").notNull().default("d,f,x"),

  binanceSpecial2Min: numeric("binance_special2_min", { precision: 18, scale: 8 }).notNull().default("0.10000000"),
  binanceSpecial2Max: numeric("binance_special2_max", { precision: 18, scale: 8 }).notNull().default("0.49999999"),
  binanceSpecial2Signal: text("binance_special2_signal").notNull().default("buy"),
  binanceSpecial2Command: text("binance_special2_command").notNull().default("d,b,y"),

  binanceSpecial3Min: numeric("binance_special3_min", { precision: 18, scale: 8 }).notNull().default("0.50000000"),
  binanceSpecial3Max: numeric("binance_special3_max", { precision: 18, scale: 8 }).notNull().default("0.99999999"),
  binanceSpecial3Signal: text("binance_special3_signal").notNull().default("sell"),
  binanceSpecial3Command: text("binance_special3_command").notNull().default("b,d,f+x"),

  // Coinbase Special Moves (P2)
  coinbaseSpecial1Min: numeric("coinbase_special1_min", { precision: 18, scale: 8 }).notNull().default("0.01000000"),
  coinbaseSpecial1Max: numeric("coinbase_special1_max", { precision: 18, scale: 8 }).notNull().default("0.09999999"),
  coinbaseSpecial1Signal: text("coinbase_special1_signal").notNull().default("buy"),
  coinbaseSpecial1Command: text("coinbase_special1_command").notNull().default("d,f,a"),

  coinbaseSpecial2Min: numeric("coinbase_special2_min", { precision: 18, scale: 8 }).notNull().default("0.10000000"),
  coinbaseSpecial2Max: numeric("coinbase_special2_max", { precision: 18, scale: 8 }).notNull().default("0.49999999"),
  coinbaseSpecial2Signal: text("coinbase_special2_signal").notNull().default("buy"),
  coinbaseSpecial2Command: text("coinbase_special2_command").notNull().default("d,b,b"),

  coinbaseSpecial3Min: numeric("coinbase_special3_min", { precision: 18, scale: 8 }).notNull().default("0.50000000"),
  coinbaseSpecial3Max: numeric("coinbase_special3_max", { precision: 18, scale: 8 }).notNull().default("0.99999999"),
  coinbaseSpecial3Signal: text("coinbase_special3_signal").notNull().default("sell"),
  coinbaseSpecial3Command: text("coinbase_special3_command").notNull().default("b,d,f+a"),
});

const numericField = z.union([z.string(), z.number()]).pipe(z.coerce.string());

export const insertConfigurationSchema = createInsertSchema(configurations).omit({ id: true }).extend({
  binanceBuyWeakMin: numericField,
  binanceBuyWeakMax: numericField,
  binanceBuyMedMin: numericField,
  binanceBuyMedMax: numericField,
  binanceBuyStrongMin: numericField,
  binanceBuyStrongMax: numericField,
  binanceSellWeakMin: numericField,
  binanceSellWeakMax: numericField,
  binanceSellMedMin: numericField,
  binanceSellMedMax: numericField,
  binanceSellStrongMin: numericField,
  binanceSellStrongMax: numericField,
  coinbaseBuyWeakMin: numericField,
  coinbaseBuyWeakMax: numericField,
  coinbaseBuyMedMin: numericField,
  coinbaseBuyMedMax: numericField,
  coinbaseBuyStrongMin: numericField,
  coinbaseBuyStrongMax: numericField,
  coinbaseSellWeakMin: numericField,
  coinbaseSellWeakMax: numericField,
  coinbaseSellMedMin: numericField,
  coinbaseSellMedMax: numericField,
  coinbaseSellStrongMin: numericField,
  coinbaseSellStrongMax: numericField,
  binanceSpecial1Min: numericField,
  binanceSpecial1Max: numericField,
  binanceSpecial2Min: numericField,
  binanceSpecial2Max: numericField,
  binanceSpecial3Min: numericField,
  binanceSpecial3Max: numericField,
  coinbaseSpecial1Min: numericField,
  coinbaseSpecial1Max: numericField,
  coinbaseSpecial2Min: numericField,
  coinbaseSpecial2Max: numericField,
  coinbaseSpecial3Min: numericField,
  coinbaseSpecial3Max: numericField,
});

export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type UpdateConfiguration = Partial<InsertConfiguration>;
