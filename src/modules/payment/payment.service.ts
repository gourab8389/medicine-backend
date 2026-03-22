import { db } from "../../config/database";
import { sendEmail, orderConfirmationEmailTemplate } from "../../lib/email";
import { logger } from "../../config/logger";
import { VerifyOrderPaymentInput, VerifySubscriptionPaymentInput } from "./payment.schema";

export const PaymentService = {
  /**
   * Called by frontend after payment gateway response.
   * Verifies the transaction and if SUCCESS:
   * - Updates order status
   * - Distributes product amounts to seller wallets
   * - GST + delivery charge stays as super admin income
   */
  async verifyOrderPayment(userId: string, data: VerifyOrderPaymentInput) {
    const order = await db.order.findFirst({
      where: { id: data.orderId, userId },
      include: {
        orderItems: { include: { seller: { include: { wallet: true } } } },
        user: { select: { email: true, name: true } },
      },
    });

    if (!order) throw new Error("Order not found");
    if (order.status === "CONFIRMED" || order.status === "DELIVERED") throw new Error("Order already processed");

    // Record payment
    const payment = await db.payment.upsert({
      where: { orderId: data.orderId },
      update: {
        transactionId: data.transactionId,
        status: data.status,
        amount: data.amount,
        gatewayResponse: data.gatewayResponse as any,
      },
      create: {
        orderId: data.orderId,
        type: "ORDER",
        transactionId: data.transactionId,
        status: data.status,
        amount: data.amount,
        gatewayResponse: data.gatewayResponse as any,
      },
    });

    if (data.status === "FAILED") {
      await db.order.update({ where: { id: data.orderId }, data: { status: "PAYMENT_FAILED" } });
      return { order: { id: data.orderId, status: "PAYMENT_FAILED" }, payment };
    }

    // SUCCESS — distribute to seller wallets
    await db.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({ where: { id: data.orderId }, data: { status: "CONFIRMED" } });

      // Update all order items to CONFIRMED
      await tx.orderItem.updateMany({ where: { orderId: data.orderId }, data: { status: "CONFIRMED" } });

      // Credit each seller wallet with their product amounts
      for (const item of order.orderItems) {
        const sellerAmount = item.totalPrice; // Seller gets their product amount only

        // Ensure wallet exists
        if (!item.seller.wallet) {
          await tx.sellerWallet.create({ data: { sellerId: item.sellerId } });
        }

        await tx.sellerWallet.update({
          where: { sellerId: item.sellerId },
          data: {
            balance: { increment: sellerAmount },
            totalEarned: { increment: sellerAmount },
            transactions: {
              create: {
                amount: sellerAmount,
                type: "CREDIT",
                description: `Order #${data.orderId} - ${item.quantity}x product`,
                orderId: data.orderId,
              },
            },
          },
        });
      }
    });

    // Send confirmation email
    try {
      await sendEmail({
        to: order.user.email,
        subject: "Order Confirmed - MediStore",
        html: orderConfirmationEmailTemplate(data.orderId, order.totalAmount),
      });
    } catch (emailError) {
      logger.error("Order confirmation email failed:", emailError);
    }

    return { order: { id: data.orderId, status: "CONFIRMED" }, payment };
  },

  /**
   * Seller subscription payment verification
   */
  async verifySubscriptionPayment(sellerId: string, data: VerifySubscriptionPaymentInput) {
    const payment = await db.payment.create({
      data: {
        sellerId,
        type: "SELLER_SUBSCRIPTION",
        transactionId: data.transactionId,
        status: data.status,
        amount: data.amount,
        gatewayResponse: data.gatewayResponse as any,
      },
    });

    if (data.status === "SUCCESS") {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await db.sellerSubscription.upsert({
        where: { sellerId },
        update: { status: "ACTIVE", startDate, endDate, transactionId: data.transactionId, amount: data.amount },
        create: { sellerId, status: "ACTIVE", startDate, endDate, transactionId: data.transactionId, amount: data.amount },
      });
    }

    return payment;
  },

  async getPaymentHistory(userId: string, role: "USER" | "SELLER") {
    if (role === "SELLER") {
      return db.payment.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: "desc" },
      });
    }

    return db.payment.findMany({
      where: { order: { userId } },
      include: { order: { select: { id: true, totalAmount: true, status: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
};
