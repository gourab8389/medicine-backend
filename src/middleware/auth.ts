import { Response, NextFunction } from "express";
import { verifyAccessToken } from "@/lib/jwt";
import { AuthRequest, JwtPayload } from "@/types";
import { forbiddenResponse, unauthorizedResponse } from "@/lib/response";
import { db } from "@/config/database";
import { logger } from "@/config/logger";

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      unauthorizedResponse(res, "Access token is missing or invalid");
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    unauthorizedResponse(res, "Invalid access token");
    return;
  }
}

// Check if user/seller is blacklisted on each request

export async function checkBlacklist(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) return next();

    const { id, role } = req.user;

    if (role === "USER") {
      const user = await db.user.findUnique({
        where: { id },
        select: { status: true },
      });
      if (user?.status === "BLACKLISTED") {
        forbiddenResponse(
          res,
          "Your account has been blacklisted. Please contact support.",
        );
        return;
      }
    }

    if(role === "SELLER") {
      const seller = await db.seller.findUnique({
        where: { id },
        select: { status: true },
      });
      if (seller?.status === "BLACKLISTED") {
        forbiddenResponse(
          res,
          "Your account has been blacklisted. Please contact support.",
        );
        return;
      }
    }
    next();
  } catch (error) {
    forbiddenResponse(res, "An error occurred while checking blacklist status.");
  }
}

// ─── Role Guards ──────────────────────────────────────────────────────────────

export function requireRole(...roles: JwtPayload["role"][]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorizedResponse(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      forbiddenResponse(res, `Access restricted to: ${roles.join(", ")}`);
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole("SUPER_ADMIN");
export const requireSeller = requireRole("SELLER");
export const requireUser = requireRole("USER");
export const requireSellerOrAdmin = requireRole("SELLER", "SUPER_ADMIN");

// ─── Seller Active Subscription Check ────────────────────────────────────────

export async function requireActiveSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user || req.user.role !== "SELLER") return next();

    const subscription = await db.sellerSubscription.findUnique({
      where: { sellerId: req.user.id },
    });

    if (!subscription || subscription.status !== "ACTIVE" || (subscription.endDate && subscription.endDate < new Date())) {
      forbiddenResponse(res, "Active subscription required. Please pay your monthly subscription.");
      return;
    }

    next();
  } catch (error) {
    logger.error("Subscription check error:", error);
    next(error);
  }
}