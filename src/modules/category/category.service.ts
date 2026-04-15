import { generateSlug } from "../../lib/slug";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.schema";
import { db } from "../../config/database";

export const CategoryService = {
  async create(data: CreateCategoryInput) {
    const slug = generateSlug(data.name);
    return db.category.create({
      data: {
        ...data,
        slug,
      },
    });
  },

  async getAll(includeInactive = false) {
    return db.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string) {
    return db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
  },

  async update(id: string, data: UpdateCategoryInput) {
    const updateData: UpdateCategoryInput & { slug?: string } = { ...data };
    if (data.name) {
      updateData.slug = generateSlug(data.name);
    }
    return db.category.update({
      where: { id },
      data: updateData,
    });
  },

  async toggleActive(id: string) {
    const category = await db.category.findUnique({ where: { id } });
    if (!category) throw new Error("Category not found");
    return db.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });
  },

  async delete(id: string) {
    const count = await db.product.count({ where: { categoryId: id } });
    if (count > 0)
      throw new Error("Cannot delete category with existing products");
    return db.category.delete({ where: { id } });
  },
};
