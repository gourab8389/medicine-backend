import { Request, Response, NextFunction } from "express";
import { WalletService } from "./wallet.service";
import { AuthRequest } from "../../types";
import { successResponse, createdResponse, badRequestResponse, notFoundResponse } from "../../lib/response";

export const WalletController = {
  async getWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const wallet = await WalletService.getWallet(req.user!.id);
      successResponse(res, "Wallet fetched", wallet);
    } catch (error) { next(error); }
  },

  async getTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await WalletService.getTransactions(req.user!.id, req.query as any);
      successResponse(res, "Transactions fetched", result.data, 200, result.meta as any);
    } catch (error) { next(error); }
  },

  async requestWithdraw(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await WalletService.requestWithdraw(req.user!.id, req.body);
      createdResponse(res, "Withdrawal request submitted", request);
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async getWithdrawRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await WalletService.getWithdrawRequests(req.user!.id);
      successResponse(res, "Withdrawal requests fetched", requests);
    } catch (error) { next(error); }
  },

  // Admin
  async getAllWithdrawRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await WalletService.getAllWithdrawRequests(req.query as any);
      successResponse(res, "Withdrawal requests fetched", result.data, 200, result.meta as any);
    } catch (error) { next(error); }
  },

  async approveWithdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WalletService.approveWithdraw(req.params.id as string, req.body.adminNote);
      successResponse(res, "Withdrawal approved");
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        notFoundResponse(res, error.message); return;
      }
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async rejectWithdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await WalletService.rejectWithdraw(req.params.id as string, req.body.adminNote);
      successResponse(res, "Withdrawal rejected", request);
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },
};
