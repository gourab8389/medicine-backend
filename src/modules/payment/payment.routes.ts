import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { validate } from "../../middleware/validate";
import { authenticate, requireUser, requireSeller, checkBlacklist } from "../../middleware/auth";
import { verifyOrderPaymentSchema, verifySubscriptionPaymentSchema } from "./payment.schema";

const router = Router();

// User pays for order
router.post("/verify/order", authenticate, requireUser, checkBlacklist, validate(verifyOrderPaymentSchema), PaymentController.verifyOrderPayment);

// Seller subscription payment
router.post("/verify/subscription", authenticate, requireSeller, checkBlacklist, validate(verifySubscriptionPaymentSchema), PaymentController.verifySubscriptionPayment);

// History (both user and seller)
router.get("/history", authenticate, checkBlacklist, PaymentController.getHistory);

export default router;
