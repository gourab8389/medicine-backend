import { z } from "zod";

export const createRatingSchema = z.object({
  orderId: z.string().cuid("Invalid order ID"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1-5"),
  review: z.string().max(1000).optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
