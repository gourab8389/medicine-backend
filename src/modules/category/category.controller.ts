import { Request, Response, NextFunction } from "express";
import { CategoryService } from "./category.service";
import { createdResponse, successResponse, badRequestResponse, notFoundResponse } from "../../lib/response";

export const CategoryController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CategoryService.create(req.body);
      createdResponse(res, "Category created", category);
    } catch (error) { next(error); }
  },

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const categories = await CategoryService.getAll(includeInactive);
      successResponse(res, "Categories fetched", categories);
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CategoryService.getById(req.params.id as string);
      if (!category) { notFoundResponse(res, "Category not found"); return; }
      successResponse(res, "Category fetched", category);
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CategoryService.update(req.params.id as string, req.body);
      successResponse(res, "Category updated", category);
    } catch (error) { next(error); }
  },

  async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CategoryService.toggleActive(req.params.id as string);
      successResponse(res, `Category ${category.isActive ? "activated" : "deactivated"}`, category);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        notFoundResponse(res, error.message); return;
      }
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await CategoryService.delete(req.params.id as string);
      successResponse(res, "Category deleted");
    } catch (error) {
      if (error instanceof Error && error.message.includes("Cannot delete")) {
        badRequestResponse(res, error.message); return;
      }
      next(error);
    }
  },
};
