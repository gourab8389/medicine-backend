import { z } from "zod";

export const uploadPrescriptionSchema = z.object({
  imageUrl: z.string().url("Valid image URL required"),
});

export type UploadPrescriptionInput = z.infer<typeof uploadPrescriptionSchema>;