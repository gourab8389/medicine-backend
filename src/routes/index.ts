import { Router } from "express";

// Module routes
import authRoutes from "../modules/auth/auth.routes";
import sellerRoutes from "../modules/seller/seller.routes";
import adminRoutes from "../modules/admin/admin.routes";
import categoryRoutes from "../modules/category/category.routes";
import productRoutes from "../modules/product/product.routes";
import addressRoutes from "../modules/address/address.routes";
import orderRoutes from "../modules/order/order.routes";
import paymentRoutes from "../modules/payment/payment.routes";
import walletRoutes from "../modules/wallet/wallet.routes";
import ratingRoutes from "../modules/rating/rating.routes";
import subscriptionRoutes from "../modules/subscription/subscription.routes";
import prescriptionRoutes from "../modules/prescription/prescription.routes";

const router = Router();

// ─── Health Check ─────────────────────────────────────────────────────────────
router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "MediStore API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
// Auth (Buyers)
router.use("/auth", authRoutes);

// Seller Auth & Profile
router.use("/seller", sellerRoutes);

// Super Admin
router.use("/admin", adminRoutes);

// Categories (public read, admin write)
router.use("/categories", categoryRoutes);

// Products (public read, seller write)
router.use("/products", productRoutes);

// Addresses (user only)
router.use("/addresses", addressRoutes);

// Orders (user create, seller update, admin view)
router.use("/orders", orderRoutes);

// Payments (user order, seller subscription)
router.use("/payments", paymentRoutes);

// Seller Wallet & Withdrawals
router.use("/wallet", walletRoutes);

// Ratings
router.use("/ratings", ratingRoutes);

// Prescriptions
router.use("/prescriptions", prescriptionRoutes);

// Subscription status
router.use("/subscription", subscriptionRoutes);

export default router;
