import { z } from "zod";

export const registerSellerSchema = z.object({
  businessName: z.string().min(2).max(200),
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  panCardNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN card format"),
  panCardImageUrl: z.string().url("PAN card image URL is required"),
  gstNumber: z.string().optional(),
  addressLine: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  bankAccountName: z.string().min(2),
  bankAccountNumber: z.string().min(9).max(18),
  bankIfscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
  expectedDeliveryDays: z.number().int().min(1).max(30).default(3),
});

export const verifySellerOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const setSellerPasswordSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/(?=.*[A-Z])/, "Must contain uppercase")
    .regex(/(?=.*[0-9])/, "Must contain number")
    .regex(/(?=.*[!@#$%^&*])/, "Must contain special character"),
});

export const sellerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateSellerProfileSchema = z.object({
  businessName: z.string().min(2).max(200).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  addressLine: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  expectedDeliveryDays: z.number().int().min(1).max(30).optional(),
  bankAccountName: z.string().min(2).optional(),
  bankAccountNumber: z.string().min(9).max(18).optional(),
  bankIfscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
});

export type RegisterSellerInput = z.infer<typeof registerSellerSchema>;
export type SetSellerPasswordInput = z.infer<typeof setSellerPasswordSchema>;
export type SellerLoginInput = z.infer<typeof sellerLoginSchema>;
export type UpdateSellerProfileInput = z.infer<typeof updateSellerProfileSchema>;
