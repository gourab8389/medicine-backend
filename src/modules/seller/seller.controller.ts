import { Request, Response, NextFunction } from "express";
import { SellerService } from "./seller.service";
import { AuthRequest } from "../../types";
import {
  createdResponse, successResponse, badRequestResponse, notFoundResponse,
} from "../../lib/response";

export const SellerController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seller = await SellerService.register(req.body);
      createdResponse(res, "Registration successful. Please verify your email.", seller);
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await SellerService.verifyOtp(req.body.email, req.body.otp);
      successResponse(res, "Email verified. Now set your password.");
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async setPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await SellerService.setPassword(req.body);
      successResponse(res, "Password set successfully. Please wait for admin approval.");
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await SellerService.resendOtp(req.body.email);
      successResponse(res, "New OTP sent to your email.");
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SellerService.login(req.body);
      successResponse(res, "Login successful", result);
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await SellerService.refreshToken(req.body.refreshToken);
      successResponse(res, "Tokens refreshed", tokens);
    } catch (error) {
      if (error instanceof Error) { badRequestResponse(res, error.message); return; }
      next(error);
    }
  },

  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const seller = await SellerService.getProfile(req.user!.id);
      successResponse(res, "Profile fetched", seller);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        notFoundResponse(res, error.message); return;
      }
      next(error);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const seller = await SellerService.updateProfile(req.user!.id, req.body);
      successResponse(res, "Profile updated", seller);
    } catch (error) {
      next(error);
    }
  },
};
