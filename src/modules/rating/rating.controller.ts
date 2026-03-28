import { Request, Response, NextFunction } from "express";
import { RatingService } from "./rating.service";
import { AuthRequest } from "../../types";
import { createdResponse, successResponse, badRequestResponse } from "../../lib/response";

export const RatingController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ratings = await RatingService.create(req.user!.id, req.body);
      createdResponse(res, "Rating submitted for all sellers in this order", ratings);
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async getSellerRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await RatingService.getSellerRatings(req.params.sellerId as string, req.query as any);
      successResponse(res, "Ratings fetched", result);
    } catch (error) { next(error); }
  },
};
