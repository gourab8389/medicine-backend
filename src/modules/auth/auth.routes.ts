import { authLimiter, otpLimiter } from "@/config/rateLimit";
import { validate } from "@/middleware/validate";
import { Router } from "express";
import { loginSchema, refreshTokenSchema, registerUserSchema, resendOtpSchema, verifyOtpSchema } from "./auth.schema";
import { AuthController } from "./auth.controller";


const router = Router();

router.post("register", authLimiter, validate(registerUserSchema), AuthController.register);
router.post("/verify-otp", validate(verifyOtpSchema), AuthController.verifyOtp);
router.post("/resend-otp", otpLimiter, validate(resendOtpSchema), AuthController.resendOtp);
router.post("/login", authLimiter, validate(loginSchema), AuthController.login);
router.post("/refresh-token", validate(refreshTokenSchema), AuthController.refreshToken);

export default router;