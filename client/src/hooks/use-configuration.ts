import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertConfiguration, type Configuration } from "@shared/routes";
import { z } from "zod";

export function useConfiguration() {
  return useQuery({
    queryKey: [api.configurations.get.path],
    queryFn: async () => {
      const res = await fetch(api.configurations.get.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null; // Handle case where no config exists yet
        throw new Error("Failed to fetch configuration");
      }
      return api.configurations.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertConfiguration) => {
      // Ensure numeric fields are actually numbers before sending
      const payload = {
        ...data,
        buyThreshold: Number(data.buyThreshold),
        sellThreshold: Number(data.sellThreshold),
      };
      
      const validated = api.configurations.update.input.parse(payload);
      
      const res = await fetch(api.configurations.update.path, {
        method: api.configurations.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.configurations.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update configuration");
      }
      return api.configurations.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.configurations.get.path] });
    },
  });
}
