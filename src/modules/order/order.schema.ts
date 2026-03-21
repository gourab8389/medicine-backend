import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().cuid("Invalid address ID"),
  items: z
    .array(
      z.object({
        productId: z.string().cuid("Invalid product ID"),
        quantity: z.number().int().min(1).max(100),
      })
    )
    .min(1, "At least one item required"),
  prescriptionId: z.string().cuid().optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderItemStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export const orderQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderItemStatusInput = z.infer<typeof updateOrderItemStatusSchema>;
