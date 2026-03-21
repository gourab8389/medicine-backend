import { Request, Response, NextFunction } from "express";
import { ProductService } from "./product.service";
import { AuthRequest } from "../../types";
import { createdResponse, successResponse, badRequestResponse, notFoundResponse } from "../../lib/response";

export const ProductController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.create(req.user!.id, req.body);
      createdResponse(res, "Product created", product);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Category")) {
        badRequestResponse(res, error.message); return;
      }
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.getAll(req.query as any);
      successResponse(res, "Products fetched", result.data, 200, result.meta as any);
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.getById(req.params.id as string);
      if (!product) { notFoundResponse(res, "Product not found"); return; }
      successResponse(res, "Product fetched", product);
    } catch (error) { next(error); }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.getBySlug(req.params.slug as string);
      if (!product) { notFoundResponse(res, "Product not found"); return; }
      successResponse(res, "Product fetched", product);
    } catch (error) { next(error); }
  },

  async getSellerProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.getSellerProducts(req.user!.id, req.query as any);
      successResponse(res, "Products fetched", result.data, 200, result.meta as any);
    } catch (error) { next(error); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.update(req.params.id as string, req.user!.id, req.body);
      successResponse(res, "Product updated", product);
    } catch (error) {
      if (error instanceof Error && error.message.includes("unauthorized")) {
        notFoundResponse(res, error.message); return;
      }
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProductService.delete(req.params.id as string, req.user!.id);
      successResponse(res, "Product deleted");
    } catch (error) {
      if (error instanceof Error && error.message.includes("unauthorized")) {
        notFoundResponse(res, error.message); return;
      }
      next(error);
    }
  },

  async adminToggle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.adminToggleProduct(req.params.id as string);
      successResponse(res, `Product ${product.isActive ? "activated" : "deactivated"}`, product);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        notFoundResponse(res, error.message); return;
      }
      next(error);
    }
  },
};
