import { db } from "../../config/database";
import {
  CreateProductInput,
  ProductQueryInput,
  UpdateProductInput,
} from "./product.schema";
import { generateUniqueSlug } from "../../lib/slug";
import { buildPaginatedResult, getPaginationParams } from "../../lib/pagination";

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  discountedPrice: true,
  quantity: true,
  images: true,
  uses: true,
  contraindications: true,
  sideEffects: true,
  precautions: true,
  warnings: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  seller: {
    select: {
      id: true,
      businessName: true,
      expectedDeliveryDays: true,
      ratings: { select: { rating: true } },
    },
  },
  faqs: true,
};

export const ProductService = {
  async create(sellerId: string, data: CreateProductInput) {
    const { faqs, ...productData } = data;

    const category = await db.category.findUnique({
      where: { id: data.categoryId, isActive: true },
    });
    if (!category) throw new Error("Category not found or inactive");

    const slug = generateUniqueSlug(data.name);

    return db.product.create({
      data: {
        ...productData,
        sellerId,
        slug,
        faqs: { create: faqs },
      },
      include: { faqs: true, category: { select: { id: true, name: true } } },
    });
  },

  async getAll(query: ProductQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);

    const where: Record<string, any> = { isActive: true };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.minPrice || query.maxPrice) {
      where.price = {
        ...(query.minPrice && { gte: Number(query.minPrice) }),
        ...(query.maxPrice && { lte: Number(query.maxPrice) }),
      };
    }
    // Only show products from approved sellers with active subscription
    where.seller = { status: "APPROVED", subscription: { status: "ACTIVE" } };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder || "asc" }
      : { createdAt: "desc" as const };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take,
        select: PRODUCT_SELECT,
        orderBy,
      }),
      db.product.count({ where }),
    ]);

    return buildPaginatedResult(products, total, page, limit);
  },

  async getById(id: string) {
    return db.product.findUnique({ where: { id }, select: PRODUCT_SELECT });
  },

  async getBySlug(slug: string) {
    return db.product.findUnique({ where: { slug }, select: PRODUCT_SELECT });
  },

  async getSellerProducts(sellerId: string, query: ProductQueryInput) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where = {
      sellerId,
      ...(query.search && {
        name: { contains: query.search, mode: "insensitive" as const },
      }),
    };
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take,
        include: { category: true, faqs: true },
        orderBy: { createdAt: "desc" },
      }),
      db.product.count({ where }),
    ]);
    return buildPaginatedResult(products, total, page, limit);
  },

  async update(productId: string, sellerId: string, data: UpdateProductInput) {
    const product = await db.product.findFirst({
      where: { id: productId, sellerId },
    });
    if (!product) throw new Error("Product not found or unauthorized");

    const { faqs, ...productData } = data;

    if (faqs) {
      await db.productFaq.deleteMany({ where: { productId } });
    }

    return db.product.update({
      where: { id: productId },
      data: {
        ...productData,
        ...(data.name && { slug: generateUniqueSlug(data.name) }),
        ...(faqs && { faqs: { create: faqs } }),
      },
      include: { faqs: true, category: { select: { id: true, name: true } } },
    });
  },

  async delete(productId: string, sellerId: string) {
    const product = await db.product.findFirst({
      where: { id: productId, sellerId },
    });
    if (!product) throw new Error("Product not found or unauthorized");

    // Soft delete
    return db.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  },

  async adminToggleProduct(productId: string) {
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");
    return db.product.update({
      where: { id: productId },
      data: { isActive: !product.isActive },
    });
  },
};
