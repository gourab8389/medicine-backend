import { z } from "zod";

export const withdrawRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

export type WithdrawRequestInput = z.infer<typeof withdrawRequestSchema>;
