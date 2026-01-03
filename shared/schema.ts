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

  binanceSpecial4Min: numeric("binance_special4_min", { precision: 18, scale: 8 }).notNull().default("1.00000000"),
  binanceSpecial4Max: numeric("binance_special4_max", { precision: 18, scale: 8 }).notNull().default("1.99999999"),
  binanceSpecial4Signal: text("binance_special4_signal").notNull().default("buy"),
  binanceSpecial4Command: text("binance_special4_command").notNull().default(""),

  binanceSpecial5Min: numeric("binance_special5_min", { precision: 18, scale: 8 }).notNull().default("2.00000000"),
  binanceSpecial5Max: numeric("binance_special5_max", { precision: 18, scale: 8 }).notNull().default("2.99999999"),
  binanceSpecial5Signal: text("binance_special5_signal").notNull().default("buy"),
  binanceSpecial5Command: text("binance_special5_command").notNull().default(""),

  binanceSpecial6Min: numeric("binance_special6_min", { precision: 18, scale: 8 }).notNull().default("3.00000000"),
  binanceSpecial6Max: numeric("binance_special6_max", { precision: 18, scale: 8 }).notNull().default("3.99999999"),
  binanceSpecial6Signal: text("binance_special6_signal").notNull().default("sell"),
  binanceSpecial6Command: text("binance_special6_command").notNull().default(""),

  binanceSpecial7Min: numeric("binance_special7_min", { precision: 18, scale: 8 }).notNull().default("4.00000000"),
  binanceSpecial7Max: numeric("binance_special7_max", { precision: 18, scale: 8 }).notNull().default("4.99999999"),
  binanceSpecial7Signal: text("binance_special7_signal").notNull().default("buy"),
  binanceSpecial7Command: text("binance_special7_command").notNull().default(""),

  binanceSpecial8Min: numeric("binance_special8_min", { precision: 18, scale: 8 }).notNull().default("5.00000000"),
  binanceSpecial8Max: numeric("binance_special8_max", { precision: 18, scale: 8 }).notNull().default("5.99999999"),
  binanceSpecial8Signal: text("binance_special8_signal").notNull().default("buy"),
  binanceSpecial8Command: text("binance_special8_command").notNull().default(""),

  binanceSpecial9Min: numeric("binance_special9_min", { precision: 18, scale: 8 }).notNull().default("6.00000000"),
  binanceSpecial9Max: numeric("binance_special9_max", { precision: 18, scale: 8 }).notNull().default("6.99999999"),
  binanceSpecial9Signal: text("binance_special9_signal").notNull().default("sell"),
  binanceSpecial9Command: text("binance_special9_command").notNull().default(""),

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

  coinbaseSpecial4Min: numeric("coinbase_special4_min", { precision: 18, scale: 8 }).notNull().default("1.00000000"),
  coinbaseSpecial4Max: numeric("coinbase_special4_max", { precision: 18, scale: 8 }).notNull().default("1.99999999"),
  coinbaseSpecial4Signal: text("coinbase_special4_signal").notNull().default("buy"),
  coinbaseSpecial4Command: text("coinbase_special4_command").notNull().default(""),

  coinbaseSpecial5Min: numeric("coinbase_special5_min", { precision: 18, scale: 8 }).notNull().default("2.00000000"),
  coinbaseSpecial5Max: numeric("coinbase_special5_max", { precision: 18, scale: 8 }).notNull().default("2.99999999"),
  coinbaseSpecial5Signal: text("coinbase_special5_signal").notNull().default("buy"),
  coinbaseSpecial5Command: text("coinbase_special5_command").notNull().default(""),

  coinbaseSpecial6Min: numeric("coinbase_special6_min", { precision: 18, scale: 8 }).notNull().default("3.00000000"),
  coinbaseSpecial6Max: numeric("coinbase_special6_max", { precision: 18, scale: 8 }).notNull().default("3.99999999"),
  coinbaseSpecial6Signal: text("coinbase_special6_signal").notNull().default("sell"),
  coinbaseSpecial6Command: text("coinbase_special6_command").notNull().default(""),

  coinbaseSpecial7Min: numeric("coinbase_special7_min", { precision: 18, scale: 8 }).notNull().default("4.00000000"),
  coinbaseSpecial7Max: numeric("coinbase_special7_max", { precision: 18, scale: 8 }).notNull().default("4.99999999"),
  coinbaseSpecial7Signal: text("coinbase_special7_signal").notNull().default("buy"),
  coinbaseSpecial7Command: text("coinbase_special7_command").notNull().default(""),

  coinbaseSpecial8Min: numeric("coinbase_special8_min", { precision: 18, scale: 8 }).notNull().default("5.00000000"),
  coinbaseSpecial8Max: numeric("coinbase_special8_max", { precision: 18, scale: 8 }).notNull().default("5.99999999"),
  coinbaseSpecial8Signal: text("coinbase_special8_signal").notNull().default("buy"),
  coinbaseSpecial8Command: text("coinbase_special8_command").notNull().default(""),

  coinbaseSpecial9Min: numeric("coinbase_special9_min", { precision: 18, scale: 8 }).notNull().default("6.00000000"),
  coinbaseSpecial9Max: numeric("coinbase_special9_max", { precision: 18, scale: 8 }).notNull().default("6.99999999"),
  coinbaseSpecial9Signal: text("coinbase_special9_signal").notNull().default("sell"),
  coinbaseSpecial9Command: text("coinbase_special9_command").notNull().default(""),

  // Binance Movement (P1)
  binanceMoveForwardMin: numeric("binance_move_forward_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  binanceMoveForwardMax: numeric("binance_move_forward_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  binanceMoveForwardSignal: text("binance_move_forward_signal").notNull().default("buy"),
  binanceMoveForwardKey: text("binance_move_forward_key").notNull().default("f"),

  binanceMoveBackwardMin: numeric("binance_move_backward_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  binanceMoveBackwardMax: numeric("binance_move_backward_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  binanceMoveBackwardSignal: text("binance_move_backward_signal").notNull().default("sell"),
  binanceMoveBackwardKey: text("binance_move_backward_key").notNull().default("g"),

  // Coinbase Movement (P2)
  coinbaseMoveForwardMin: numeric("coinbase_move_forward_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  coinbaseMoveForwardMax: numeric("coinbase_move_forward_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  coinbaseMoveForwardSignal: text("coinbase_move_forward_signal").notNull().default("buy"),
  coinbaseMoveForwardKey: text("coinbase_move_forward_key").notNull().default("l"),

  coinbaseMoveBackwardMin: numeric("coinbase_move_backward_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  coinbaseMoveBackwardMax: numeric("coinbase_move_backward_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  coinbaseMoveBackwardSignal: text("coinbase_move_backward_signal").notNull().default("sell"),
  coinbaseMoveBackwardKey: text("coinbase_move_backward_key").notNull().default("k"),

  // Binance Jump/Crouch (P1)
  binanceJumpMin: numeric("binance_jump_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  binanceJumpMax: numeric("binance_jump_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  binanceJumpSignal: text("binance_jump_signal").notNull().default("buy"),
  binanceJumpKey: text("binance_jump_key").notNull().default("w"),
  binanceJumpLeftKey: text("binance_jump_left_key").notNull().default("f"),
  binanceJumpRightKey: text("binance_jump_right_key").notNull().default("h"),
  binanceJumpDelay: numeric("binance_jump_delay", { precision: 10, scale: 2 }).notNull().default("5.00"),

  binanceCrouchMin: numeric("binance_crouch_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  binanceCrouchMax: numeric("binance_crouch_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  binanceCrouchSignal: text("binance_crouch_signal").notNull().default("sell"),
  binanceCrouchKey: text("binance_crouch_key").notNull().default("e"),
  binanceCrouchDelay: numeric("binance_crouch_delay", { precision: 10, scale: 2 }).notNull().default("5.00"),

  // Coinbase Jump/Crouch (P2)
  coinbaseJumpMin: numeric("coinbase_jump_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  coinbaseJumpMax: numeric("coinbase_jump_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  coinbaseJumpSignal: text("coinbase_jump_signal").notNull().default("buy"),
  coinbaseJumpKey: text("coinbase_jump_key").notNull().default("o"),
  coinbaseJumpLeftKey: text("coinbase_jump_left_key").notNull().default("p"),
  coinbaseJumpRightKey: text("coinbase_jump_right_key").notNull().default("k"),
  coinbaseJumpDelay: numeric("coinbase_jump_delay", { precision: 10, scale: 2 }).notNull().default("5.00"),

  coinbaseCrouchMin: numeric("coinbase_crouch_min", { precision: 18, scale: 8 }).notNull().default("0.00001000"),
  coinbaseCrouchMax: numeric("coinbase_crouch_max", { precision: 18, scale: 8 }).notNull().default("0.00009999"),
  coinbaseCrouchSignal: text("coinbase_crouch_signal").notNull().default("sell"),
  coinbaseCrouchKey: text("coinbase_crouch_key").notNull().default("p"),
  coinbaseCrouchDelay: numeric("coinbase_crouch_delay", { precision: 10, scale: 2 }).notNull().default("5.00"),
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
  binanceSpecial4Min: numericField,
  binanceSpecial4Max: numericField,
  binanceSpecial5Min: numericField,
  binanceSpecial5Max: numericField,
  binanceSpecial6Min: numericField,
  binanceSpecial6Max: numericField,
  binanceSpecial7Min: numericField,
  binanceSpecial7Max: numericField,
  binanceSpecial8Min: numericField,
  binanceSpecial8Max: numericField,
  binanceSpecial9Min: numericField,
  binanceSpecial9Max: numericField,
  coinbaseSpecial1Min: numericField,
  coinbaseSpecial1Max: numericField,
  coinbaseSpecial2Min: numericField,
  coinbaseSpecial2Max: numericField,
  coinbaseSpecial3Min: numericField,
  coinbaseSpecial3Max: numericField,
  coinbaseSpecial4Min: numericField,
  coinbaseSpecial4Max: numericField,
  coinbaseSpecial5Min: numericField,
  coinbaseSpecial5Max: numericField,
  coinbaseSpecial6Min: numericField,
  coinbaseSpecial6Max: numericField,
  coinbaseSpecial7Min: numericField,
  coinbaseSpecial7Max: numericField,
  coinbaseSpecial8Min: numericField,
  coinbaseSpecial8Max: numericField,
  coinbaseSpecial9Min: numericField,
  coinbaseSpecial9Max: numericField,
  binanceMoveForwardMin: numericField,
  binanceMoveForwardMax: numericField,
  binanceMoveBackwardMin: numericField,
  binanceMoveBackwardMax: numericField,
  coinbaseMoveForwardMin: numericField,
  coinbaseMoveForwardMax: numericField,
  coinbaseMoveBackwardMin: numericField,
  coinbaseMoveBackwardMax: numericField,
  binanceJumpMin: numericField,
  binanceJumpMax: numericField,
  binanceJumpDelay: numericField,
  binanceCrouchMin: numericField,
  binanceCrouchMax: numericField,
  binanceCrouchDelay: numericField,
  coinbaseJumpMin: numericField,
  coinbaseJumpMax: numericField,
  coinbaseJumpDelay: numericField,
  coinbaseCrouchMin: numericField,
  coinbaseCrouchMax: numericField,
  coinbaseCrouchDelay: numericField,
});

export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type UpdateConfiguration = Partial<InsertConfiguration>;
