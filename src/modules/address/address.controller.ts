import { Response, NextFunction } from "express";
import { AddressService } from "./address.service";
import { AuthRequest } from "../../types";
import { createdResponse, successResponse, badRequestResponse, notFoundResponse } from "../../lib/response";

export const AddressController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = await AddressService.create(req.user!.id, req.body);
      createdResponse(res, "Address added", address);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Maximum")) {
        badRequestResponse(res, error.message); return;
      }
      next(error);
    }
  },

  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const addresses = await AddressService.getByUser(req.user!.id);
      successResponse(res, "Addresses fetched", addresses);
    } catch (error) { next(error); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = await AddressService.update(req.params.id as string, req.user!.id, req.body);
      successResponse(res, "Address updated", address);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        notFoundResponse(res, error.message); return;
      }
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await AddressService.delete(req.params.id as string, req.user!.id);
      successResponse(res, "Address deleted");
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        notFoundResponse(res, error.message); return;
      }
      next(error);
    }
  },
};
