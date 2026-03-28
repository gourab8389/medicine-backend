import { Router } from "express";
import { WalletController } from "./wallet.controller";
import { validate } from "../../middleware/validate";
import { authenticate, requireSeller, requireAdmin, checkBlacklist } from "../../middleware/auth";
import { withdrawRequestSchema } from "./wallet.schema";

const router = Router();

// Seller wallet
router.get("/", authenticate, requireSeller, checkBlacklist, WalletController.getWallet);
router.get("/transactions", authenticate, requireSeller, checkBlacklist, WalletController.getTransactions);
router.post("/withdraw", authenticate, requireSeller, checkBlacklist, validate(withdrawRequestSchema), WalletController.requestWithdraw);
router.get("/withdraw/requests", authenticate, requireSeller, checkBlacklist, WalletController.getWithdrawRequests);

// Admin
router.get("/admin/withdraw-requests", authenticate, requireAdmin, WalletController.getAllWithdrawRequests);
router.patch("/admin/withdraw-requests/:id/approve", authenticate, requireAdmin, WalletController.approveWithdraw);
router.patch("/admin/withdraw-requests/:id/reject", authenticate, requireAdmin, WalletController.rejectWithdraw);

export default router;
