// Subscription routes redirect to payment routes for verification
// This file provides subscription-specific endpoints

import { Router } from "express";
import { authenticate, requireSeller, checkBlacklist } from "../../middleware/auth";
import { db } from "../../config/database";
import { successResponse } from "../../lib/response";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types";

const router = Router();

router.get("/status", authenticate, requireSeller, checkBlacklist, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const subscription = await db.sellerSubscription.findUnique({
      where: { sellerId: req.user!.id },
    });
    successResponse(res, "Subscription status fetched", subscription);
  } catch (error) { next(error); }
});

export default router;
