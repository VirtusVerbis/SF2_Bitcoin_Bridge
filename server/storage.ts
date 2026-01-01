import { db } from "./db";
import {
  configurations,
  type Configuration,
  type InsertConfiguration,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getConfiguration(): Promise<Configuration>;
  updateConfiguration(config: InsertConfiguration): Promise<Configuration>;
}

export class DatabaseStorage implements IStorage {
  async getConfiguration(): Promise<Configuration> {
    const [config] = await db.select().from(configurations).limit(1);
    if (config) return config;
    
    // Create default if not exists
    const [newConfig] = await db.insert(configurations).values({
      symbol: "btcusdt",
      coinbaseSymbol: "BTC-USD",
      isActive: true
      // Other fields will use defaults from schema
    }).returning();
    return newConfig;
  }

  async updateConfiguration(update: InsertConfiguration): Promise<Configuration> {
    const current = await this.getConfiguration();
    const [updated] = await db
      .update(configurations)
      .set(update)
      .where(eq(configurations.id, current.id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
