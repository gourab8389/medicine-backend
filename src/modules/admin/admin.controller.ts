import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";
import { badRequestResponse, notFoundResponse, successResponse } from "../../lib/response";

export const AdminController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.login(req.body);
      successResponse(res, "Login successful", result);
    } catch (error) {
      if (error instanceof Error) {
        badRequestResponse(res, error.message);
        return;
      }
      next(error);
    }
  },

    async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await AdminService.refreshToken(req.body.refreshToken);
      successResponse(res, "Tokens refreshed", tokens);
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminService.getDashboardStats();
      successResponse(res, "Dashboard stats", stats);
    } catch (error) { next(error); }
  },

  async getSellers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getSellers(req.query as any);
      successResponse(res, "Sellers fetched", result.data, 200, result.meta as any);
    } catch (error) { next(error); }
  },

  async getSellerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seller = await AdminService.getSellerById(req.params.id as string);
      if (!seller) { notFoundResponse(res, "Seller not found"); return; }
      successResponse(res, "Seller fetched", seller);
    } catch (error) { next(error); }
  },

  async approveSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdminService.approveSeller(req.params.id as string);
      successResponse(res, "Seller approved");
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async rejectSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AdminService.rejectSeller(req.params.id as string, req.body.reason);
      successResponse(res, "Seller rejected");
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async blacklistSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seller = await AdminService.blacklistSeller(req.params.id as string);
      successResponse(res, `Seller ${seller.status === "BLACKLISTED" ? "blacklisted" : "removed from blacklist"}`, seller);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        notFoundResponse(res, error.message); return;
      }
      next(error);
    }
  },

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getUsers(req.query as any);
      successResponse(res, "Users fetched", result.data, 200, result.meta as any);
    } catch (error) { next(error); }
  },

  async blacklistUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AdminService.blacklistUser(req.params.id as string);
      successResponse(res, `User ${user.status === "BLACKLISTED" ? "blacklisted" : "removed from blacklist"}`, user);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        notFoundResponse(res, error.message); return;
      }
      next(error);
    }
  },

  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await AdminService.getSettings();
      successResponse(res, "Settings fetched", settings);
    } catch (error) { next(error); }
  },

  async updateSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const setting = await AdminService.updateSetting(req.body.key, req.body.value);
      successResponse(res, "Setting updated", setting);
    } catch (error) { next(error); }
  },
};
