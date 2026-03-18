import { Router } from "express";
import { SellerController } from "./seller.controller";
import { validate } from "../../middleware/validate";
import { authenticate, requireSeller, checkBlacklist } from "../../middleware/auth";
import {
  registerSellerSchema, verifySellerOtpSchema, setSellerPasswordSchema,
  sellerLoginSchema, refreshTokenSchema, resendOtpSchema, updateSellerProfileSchema,
} from "./seller.schema";
import { authLimiter, otpLimiter } from "../../config/rateLimit";

const router = Router();

// Public
router.post("/register", authLimiter, validate(registerSellerSchema), SellerController.register);
router.post("/verify-otp", validate(verifySellerOtpSchema), SellerController.verifyOtp);
router.post("/set-password", validate(setSellerPasswordSchema), SellerController.setPassword);
router.post("/resend-otp", otpLimiter, validate(resendOtpSchema), SellerController.resendOtp);
router.post("/login", authLimiter, validate(sellerLoginSchema), SellerController.login);
router.post("/refresh-token", validate(refreshTokenSchema), SellerController.refreshToken);

// Protected
router.get("/profile", authenticate, requireSeller, checkBlacklist, SellerController.getProfile);
router.put("/profile", authenticate, requireSeller, checkBlacklist, validate(updateSellerProfileSchema), SellerController.updateProfile);

export default router;
