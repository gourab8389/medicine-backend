import { db } from "../../config/database";
import { Prisma } from "../../../generated/prisma";
import { getAppSettings, calculateOrderAmounts } from "../../lib/settings";
import { getPaginationParams, buildPaginatedResult } from "../../lib/pagination";
import { checkPrescription } from "../../lib/gemini";
import { sendEmail, orderConfirmationEmailTemplate } from "../../lib/email";
import { CreateOrderInput, UpdateOrderItemStatusInput } from "./order.schema";

export const OrderService = {
  async create(userId: string, data: CreateOrderInput) {
    // 1. Validate address belongs to user
    const address = await db.address.findFirst({ where: { id: data.addressId, userId } });
    if (!address) throw new Error("Address not found");

    // 2. Fetch all products with seller info
    const productIds = data.items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        seller: {
          include: { subscription: true },
        },
      },
    });

    if (products.length !== data.items.length) throw new Error("One or more products are unavailable");

    // 3. Validate sellers are active and subscribed
    for (const product of products) {
      if (product.seller.status !== "APPROVED") throw new Error(`Product "${product.name}" seller is not approved`);
      if (product.seller.subscription?.status !== "ACTIVE") throw new Error(`Product "${product.name}" seller subscription is inactive`);

      // Check stock
      const orderItem = data.items.find((i) => i.productId === product.id)!;
      if (product.quantity < orderItem.quantity) throw new Error(`Insufficient stock for "${product.name}"`);
    }

    // 4. Calculate subtotal
    let subtotal = 0;
    const itemsWithDetails = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const effectivePrice = product.discountedPrice ?? product.price;
      const totalPrice = effectivePrice * item.quantity;
      subtotal += totalPrice;
      return { ...item, product, effectivePrice, totalPrice };
    });

    // 5. Calculate delivery, GST, total
    const settings = await getAppSettings();
    const { deliveryCharge, gstAmount, totalAmount } = calculateOrderAmounts(subtotal, settings);

    // 6. Prescription AI check
    let prescriptionStatus = null;
    if (data.prescriptionId) {
      const prescription = await db.prescription.findFirst({ where: { id: data.prescriptionId, userId } });
      if (!prescription) throw new Error("Prescription not found");

      const medicineNames = products.map((p) => p.name);
      const aiResult = await checkPrescription(prescription.imageUrl, medicineNames);

      await db.prescription.update({
        where: { id: data.prescriptionId },
        data: { aiResult: aiResult as unknown as Prisma.InputJsonValue, status: aiResult.isValid ? "APPROVED" : "REJECTED" },
      });

      prescriptionStatus = aiResult;
    }

    // 7. Create order, order items, update stock — all in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId: data.addressId,
          subtotal,
          deliveryCharge,
          gstAmount,
          totalAmount,
          prescriptionId: data.prescriptionId ?? null,
          notes: data.notes,
          status: "PAYMENT_PENDING",
          orderItems: {
            create: itemsWithDetails.map((item) => {
              const deliveryDate = new Date();
              deliveryDate.setDate(deliveryDate.getDate() + item.product.seller.expectedDeliveryDays);
              return {
                productId: item.productId,
                sellerId: item.product.sellerId,
                quantity: item.quantity,
                price: item.product.price,
                discountedPrice: item.product.discountedPrice ?? null,
                totalPrice: item.totalPrice,
                expectedDelivery: deliveryDate,
              };
            }),
          },
        },
        include: {
          orderItems: { include: { product: { select: { id: true, name: true, images: true } }, seller: { select: { id: true, businessName: true } } } },
          address: true,
        },
      });

      // Decrease stock
      for (const item of itemsWithDetails) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    const user = await db.user.findUnique({ where: { id: userId } });

    await sendEmail({
      to: user?.email!,
      subject: "Order Confirmation",
      html: orderConfirmationEmailTemplate(order.id, order.totalAmount),
    });

    return { order, prescriptionStatus };
  },

  async getUserOrders(userId: string, query: { page?: string; limit?: string; status?: string }) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where: Record<string, unknown> = { userId };
    if (query.status) where.status = query.status;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take,
        include: {
          orderItems: {
            include: {
              product: { select: { id: true, name: true, images: true } },
              seller: { select: { id: true, businessName: true } },
            },
          },
          address: true,
          payment: { select: { status: true, transactionId: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.order.count({ where }),
    ]);

    return buildPaginatedResult(orders, total, page, limit);
  },

  async getOrderById(orderId: string, userId: string) {
    return db.order.findFirst({
      where: { id: orderId, userId },
      include: {
        orderItems: {
          include: {
            product: true,
            seller: { select: { id: true, businessName: true, expectedDeliveryDays: true } },
          },
        },
        address: true,
        payment: true,
        prescription: true,
      },
    });
  },

  async getSellerOrders(sellerId: string, query: { page?: string; limit?: string; status?: string }) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where: Record<string, unknown> = { sellerId };
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      db.orderItem.findMany({
        where,
        skip,
        take,
        include: {
          order: { include: { user: { select: { id: true, name: true, email: true } }, address: true } },
          product: { select: { id: true, name: true, images: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.orderItem.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  },

  async updateOrderItemStatus(itemId: string, sellerId: string, data: UpdateOrderItemStatusInput) {
    const item = await db.orderItem.findFirst({ where: { id: itemId, sellerId } });
    if (!item) throw new Error("Order item not found");

    return db.orderItem.update({ where: { id: itemId }, data: { status: data.status } });
  },

  async getAdminOrders(query: { page?: string; limit?: string; status?: string }) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, name: true, email: true } },
          orderItems: { include: { seller: { select: { id: true, businessName: true } } } },
          payment: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.order.count({ where }),
    ]);

    return buildPaginatedResult(orders, total, page, limit);
  },
};
