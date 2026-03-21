import { Router } from "express";
import { ProductController } from "./product.controller";
import { validate } from "../../middleware/validate";
import {
  authenticate, requireSeller, requireAdmin, checkBlacklist, requireActiveSubscription,
} from "../../middleware/auth";
import { createProductSchema, updateProductSchema, productQuerySchema } from "./product.schema";

const router = Router();

// Public
router.get("/", validate(productQuerySchema, "query"), ProductController.getAll);
router.get("/slug/:slug", ProductController.getBySlug);
router.get("/:id", ProductController.getById);

// Seller (requires active subscription)
router.post("/", authenticate, requireSeller, checkBlacklist, requireActiveSubscription, validate(createProductSchema), ProductController.create);
router.put("/:id", authenticate, requireSeller, checkBlacklist, requireActiveSubscription, validate(updateProductSchema), ProductController.update);
router.delete("/:id", authenticate, requireSeller, checkBlacklist, ProductController.delete);
router.get("/seller/my-products", authenticate, requireSeller, checkBlacklist, validate(productQuerySchema, "query"), ProductController.getSellerProducts);

// Admin
router.patch("/:id/toggle", authenticate, requireAdmin, ProductController.adminToggle);

export default router;
