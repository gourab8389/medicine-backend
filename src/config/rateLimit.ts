import rateLimit from "express-rate-limit";

// General API rate limit
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth routes (login, register, OTP)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: "Too many auth attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP resend limiter
export const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: { success: false, message: "Too many OTP requests, please wait 1 minute." },
  standardHeaders: true,
  legacyHeaders: false,
});