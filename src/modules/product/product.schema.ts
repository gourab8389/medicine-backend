import { z } from "zod";

const faqSchema = z.object({
  question: z.string().min(5).max(500),
  answer: z.string().min(5).max(1000),
});

export const createProductSchema = z.object({
  categoryId: z.string().cuid("Invalid category ID"),
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(2000),
  price: z.number().positive("Price must be positive"),
  discountedPrice: z.number().positive().optional(),
  quantity: z.number().int().min(0).default(0),
  images: z.array(z.string().url()).min(1, "At least one image required").max(10),
  uses: z.array(z.string()).min(1).max(20),
  contraindications: z.array(z.string()).max(20).default([]),
  sideEffects: z.array(z.string()).max(20).default([]),
  precautions: z.array(z.string()).max(20).default([]),
  warnings: z.array(z.string()).max(20).default([]),
  faqs: z.array(faqSchema).max(20).default([]),
}).refine(
  (data) => !data.discountedPrice || data.discountedPrice < data.price,
  { message: "Discounted price must be less than original price", path: ["discountedPrice"] }
);

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  sellerId: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sortBy: z.enum(["price", "createdAt", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
