import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import {
  createdResponse,
  successResponse,
  badRequestResponse,
} from "../../lib/response";

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.registerUser(req.body);
      createdResponse(res, "Registration successful. Please verify your email with the OTP sent.", user);
    } catch (error) {
      if (error instanceof Error && (error.message.includes("already") || error.message.includes("not found"))) {
        badRequestResponse(res, error.message);
        return;
      }
      next(error);
    }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.verifyOtp(email, otp);
      successResponse(res, "Email verified successfully. You are now logged in.", result);
    } catch (error) {
      if (error instanceof Error) {
        badRequestResponse(res, error.message);
        return;
      }
      next(error);
    }
  },

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resendOtp(req.body.email);
      successResponse(res, "New OTP sent to your email.");
    } catch (error) {
      if (error instanceof Error) {
        badRequestResponse(res, error.message);
        return;
      }
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
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
      const tokens = await AuthService.refreshToken(req.body.refreshToken);
      successResponse(res, "Tokens refreshed", tokens);
    } catch (error) {
      if (error instanceof Error) {
        badRequestResponse(res, error.message);
        return;
      }
      next(error);
    }
  },
};
