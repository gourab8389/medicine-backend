import { authLimiter } from "@/config/rateLimit";
import { validate } from "@/middleware/validate";
import { Router } from "express";
import { adminLoginSchema, approveRejectSellerSchema, appSettingSchema } from "./admin.schema";
import { AdminController } from "./admin.controller";
import { authenticate, requireAdmin } from "@/middleware/auth";
import { refreshTokenSchema } from "../seller/seller.schema";


const router = Router();

// Public
router.post("/login", authLimiter, validate(adminLoginSchema), AdminController.login);
router.post("/refresh-token", validate(refreshTokenSchema), AdminController.refreshToken);

// Protected admin routes
router.use(authenticate, requireAdmin);

router.get("/dashboard", AdminController.getDashboard);

// Sellers
router.get("/sellers", AdminController.getSellers);
router.get("/sellers/:id", AdminController.getSellerById);
router.patch("/sellers/:id/approve", AdminController.approveSeller);
router.patch("/sellers/:id/reject", validate(approveRejectSellerSchema), AdminController.rejectSeller);
router.patch("/sellers/:id/blacklist", AdminController.blacklistSeller);

// Users
router.get("/users", AdminController.getUsers);
router.patch("/users/:id/blacklist", AdminController.blacklistUser);

// Settings
router.get("/settings", AdminController.getSettings);
router.post("/settings", validate(appSettingSchema), AdminController.updateSetting);

export default router;