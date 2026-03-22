import { z } from "zod";

export const verifyOrderPaymentSchema = z.object({
  orderId: z.string().cuid("Invalid order ID"),
  transactionId: z.string().min(1, "Transaction ID required"),
  status: z.enum(["SUCCESS", "FAILED"]),
  amount: z.number().positive(),
  gatewayResponse: z.record(z.string(), z.any()).optional(),
});

export const verifySubscriptionPaymentSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID required"),
  status: z.enum(["SUCCESS", "FAILED"]),
  amount: z.number().positive(),
  gatewayResponse: z.record(z.string(), z.any()).optional(),
});

export type VerifyOrderPaymentInput = z.infer<typeof verifyOrderPaymentSchema>;
export type VerifySubscriptionPaymentInput = z.infer<typeof verifySubscriptionPaymentSchema>;
