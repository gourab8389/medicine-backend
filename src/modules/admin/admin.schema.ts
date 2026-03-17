import { email, z } from "zod";

export const adminLoginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1).max(100),
});

export const blacklistSchema = z.object({
        reason: z.string().max(500).optional(),
});

export const appSettingSchema = z.object({
  key: z.enum(["GST_PERCENTAGE", "DELIVERY_CHARGE", "FREE_DELIVERY_ABOVE", "MONTHLY_SUBSCRIPTION_AMOUNT", "SELLER_WITHDRAW_MINIMUM"]),
  value: z.string().min(1),
});

export const approveRejectSellerSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export type AppSettingInput = z.infer<typeof appSettingSchema>;
