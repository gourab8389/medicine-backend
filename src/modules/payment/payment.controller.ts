import { Response, NextFunction } from "express";
import { PaymentService } from "./payment.service";
import { AuthRequest } from "../../types";
import { successResponse, badRequestResponse } from "../../lib/response";

export const PaymentController = {
  async verifyOrderPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PaymentService.verifyOrderPayment(req.user!.id, req.body);
      successResponse(res, "Payment processed", result);
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async verifySubscriptionPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PaymentService.verifySubscriptionPayment(req.user!.id, req.body);
      successResponse(res, "Subscription payment processed", result);
    } catch (error) { next(error); }
  },

  async getHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.user!.role as "USER" | "SELLER";
      const history = await PaymentService.getPaymentHistory(req.user!.id, role);
      successResponse(res, "Payment history fetched", history);
    } catch (error) { next(error); }
  },
};
