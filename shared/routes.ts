import { z } from 'zod';
import { insertConfigurationSchema, configurations } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  configurations: {
    get: {
      method: 'GET' as const,
      path: '/api/configurations',
      responses: {
        200: z.custom<typeof configurations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/configurations',
      input: insertConfigurationSchema,
      responses: {
        200: z.custom<typeof configurations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};
