import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.configurations.get.path, async (req, res) => {
    const config = await storage.getConfiguration();
    res.json(config);
  });

  app.post(api.configurations.update.path, async (req, res) => {
    try {
      const input = api.configurations.update.input.parse(req.body);
      const config = await storage.updateConfiguration(input);
      res.json(config);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  return httpServer;
}
