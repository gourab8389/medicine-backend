import { z } from "zod";

export const createAddressSchema = z.object({
  type: z.enum(["HOME", "OFFICE", "OTHERS"]).default("HOME"),
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  addressLine: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
