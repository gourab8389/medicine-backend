import { Router } from "express";
import { CategoryController } from "./category.controller";
import { validate } from "../../middleware/validate";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { createCategorySchema, updateCategorySchema } from "./category.schema";

const router = Router();

// Public
router.get("/", CategoryController.getAll);
router.get("/:id", CategoryController.getById);

// Admin only
router.post("/", authenticate, requireAdmin, validate(createCategorySchema), CategoryController.create);
router.put("/:id", authenticate, requireAdmin, validate(updateCategorySchema), CategoryController.update);
router.patch("/:id/toggle", authenticate, requireAdmin, CategoryController.toggleActive);
router.delete("/:id", authenticate, requireAdmin, CategoryController.delete);

export default router;
