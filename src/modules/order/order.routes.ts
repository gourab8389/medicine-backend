import { Router } from "express";
import { OrderController } from "./order.controller";
import { validate } from "../../middleware/validate";
import { authenticate, requireUser, requireSeller, requireAdmin, checkBlacklist } from "../../middleware/auth";
import { createOrderSchema, updateOrderItemStatusSchema, orderQuerySchema } from "./order.schema";

const router = Router();

// User
router.post("/", authenticate, requireUser, checkBlacklist, validate(createOrderSchema), OrderController.create);
router.get("/my", authenticate, requireUser, validate(orderQuerySchema, "query"), OrderController.getUserOrders);
router.get("/my/:id", authenticate, requireUser, OrderController.getOrderById);

// Seller
router.get("/seller", authenticate, requireSeller, checkBlacklist, validate(orderQuerySchema, "query"), OrderController.getSellerOrders);
router.patch("/seller/items/:itemId/status", authenticate, requireSeller, checkBlacklist, validate(updateOrderItemStatusSchema), OrderController.updateOrderItemStatus);

// Admin
router.get("/admin", authenticate, requireAdmin, validate(orderQuerySchema, "query"), OrderController.getAdminOrders);

export default router;
