import { z } from 'zod';

export const orderIdParamsSchema = z.object({
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
});

export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
