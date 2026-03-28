import { db } from "../../config/database";
import { getAppSettings } from "../../lib/settings";
import { getPaginationParams, buildPaginatedResult } from "../../lib/pagination";
import { sendEmail, withdrawApprovedEmailTemplate } from "../../lib/email";
import { logger } from "../../config/logger";
import { WithdrawRequestInput } from "./wallet.schema";

export const WalletService = {
  async getWallet(sellerId: string) {
    let wallet = await db.sellerWallet.findUnique({
      where: { sellerId },
      include: {
        transactions: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });

    if (!wallet) {
      wallet = await db.sellerWallet.create({
        data: { sellerId },
        include: { transactions: true },
      });
    }

    return wallet;
  },

  async getTransactions(sellerId: string, query: { page?: string; limit?: string }) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const wallet = await db.sellerWallet.findUnique({ where: { sellerId } });
    if (!wallet) return buildPaginatedResult([], 0, page, limit);

    const [transactions, total] = await Promise.all([
      db.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      db.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    return buildPaginatedResult(transactions, total, page, limit);
  },

  async requestWithdraw(sellerId: string, data: WithdrawRequestInput) {
    const settings = await getAppSettings();
    const wallet = await db.sellerWallet.findUnique({ where: { sellerId } });
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.balance < settings.SELLER_WITHDRAW_MINIMUM) {
      throw new Error(`Minimum withdrawal amount is ₹${settings.SELLER_WITHDRAW_MINIMUM}`);
    }
    if (data.amount > wallet.balance) throw new Error("Insufficient balance");
    if (data.amount < settings.SELLER_WITHDRAW_MINIMUM) {
      throw new Error(`Minimum withdrawal amount is ₹${settings.SELLER_WITHDRAW_MINIMUM}`);
    }

    // Check for pending requests
    const pending = await db.withdrawRequest.findFirst({ where: { sellerId, status: "PENDING" } });
    if (pending) throw new Error("You already have a pending withdrawal request");

    return db.withdrawRequest.create({ data: { sellerId, amount: data.amount } });
  },

  async getWithdrawRequests(sellerId: string) {
    return db.withdrawRequest.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
    });
  },

  // Admin
  async getAllWithdrawRequests(query: { page?: string; limit?: string; status?: string }) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [requests, total] = await Promise.all([
      db.withdrawRequest.findMany({
        where,
        skip,
        take,
        include: {
          seller: { select: { id: true, businessName: true, email: true, bankAccountName: true, bankAccountNumber: true, bankIfscCode: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.withdrawRequest.count({ where }),
    ]);

    return buildPaginatedResult(requests, total, page, limit);
  },

  async approveWithdraw(requestId: string, adminNote?: string) {
    const request = await db.withdrawRequest.findUnique({
      where: { id: requestId },
      include: { seller: { select: { email: true, businessName: true } } },
    });
    if (!request) throw new Error("Request not found");
    if (request.status !== "PENDING") throw new Error("Request already processed");

    await db.$transaction(async (tx) => {
      await tx.withdrawRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED", adminNote, processedAt: new Date() },
      });

      await tx.sellerWallet.update({
        where: { sellerId: request.sellerId },
        data: {
          balance: { decrement: request.amount },
          totalWithdrawn: { increment: request.amount },
          transactions: {
            create: {
              amount: request.amount,
              type: "DEBIT",
              description: `Withdrawal approved - Request #${requestId}`,
            },
          },
        },
      });
    });

    try {
      await sendEmail({
        to: request.seller.email,
        subject: "Withdrawal Approved - MediStore",
        html: withdrawApprovedEmailTemplate(request.amount),
      });
    } catch (err) {
      logger.error("Withdraw approval email failed:", err);
    }

    return true;
  },

  async rejectWithdraw(requestId: string, adminNote: string) {
    const request = await db.withdrawRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Request not found");
    if (request.status !== "PENDING") throw new Error("Request already processed");

    return db.withdrawRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", adminNote, processedAt: new Date() },
    });
  },
};
