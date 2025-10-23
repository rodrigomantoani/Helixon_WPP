import { z } from 'zod';

export const phoneSchema = z
  .string()
  .min(10)
  .max(15)
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const emailSchema = z.string().email('Invalid email format');

export const productSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  description: z.string(),
  priceCents: z.number().int().positive(),
  currency: z.string().length(3),
  active: z.boolean(),
});

export const orderSchema = z.object({
  customerId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const mercadopagoWebhookSchema = z.object({
  action: z.string().optional(),
  api_version: z.string().optional(),
  data: z.object({
    id: z.string(),
  }),
  date_created: z.string().optional(),
  id: z.number(),
  live_mode: z.boolean().optional(),
  type: z.string(),
  user_id: z.string().optional(),
});

export type Phone = z.infer<typeof phoneSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Product = z.infer<typeof productSchema>;
export type Order = z.infer<typeof orderSchema>;
export type MercadoPagoWebhook = z.infer<typeof mercadopagoWebhookSchema>;
