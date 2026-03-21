import { Request, Response, NextFunction } from "express";
import { OrderService } from "./order.service";
import { AuthRequest } from "../../types";
import { createdResponse, successResponse, badRequestResponse, notFoundResponse } from "../../lib/response";

export const OrderController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OrderService.create(req.user!.id, req.body);
      createdResponse(res, "Order created. Proceed to payment.", result);
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async getUserOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OrderService.getUserOrders(req.user!.id, req.query as any);
      successResponse(res, "Orders fetched", result.data, 200, result.meta as any);
    } catch (error) { next(error); }
  },

  async getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrderService.getOrderById(req.params.id as string, req.user!.id);
      if (!order) { notFoundResponse(res, "Order not found"); return; }
      successResponse(res, "Order fetched", order);
    } catch (error) { next(error); }
  },

  async getSellerOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OrderService.getSellerOrders(req.user!.id, req.query as any);
      successResponse(res, "Seller orders fetched", result.data, 200, result.meta as any);
    } catch (error) { next(error); }
  },

  async updateOrderItemStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await OrderService.updateOrderItemStatus(req.params.itemId as string, req.user!.id, req.body);
      successResponse(res, "Order status updated", item);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        notFoundResponse(res, error.message); return;
      }
      next(error);
    }
  },

  async getAdminOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OrderService.getAdminOrders(req.query as any);
      successResponse(res, "Orders fetched", result.data, 200, result.meta as any);
    } catch (error) { next(error); }
  },
};
