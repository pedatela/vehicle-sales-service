import { z } from 'zod';

export const createSaleSchema = z.object({
  vehicleId: z.string().min(1, 'vehicleId obrigatório'),
  buyerCpf: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve conter 11 dígitos'),
  totalAmount: z.number().positive().optional()
});

export const paymentWebhookSchema = z.object({
  paymentCode: z.string().min(1, 'paymentCode obrigatório'),
  status: z.enum(['PAID', 'CANCELED']),
  payload: z.record(z.string(), z.unknown()).optional()
});

export const vehicleSyncSchema = z.object({
  vehicleId: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  version: z.string().optional(),
  year: z.number().int().gte(1950),
  color: z.string().min(1),
  price: z.number().positive(),
  isSold: z.boolean().optional()
});
