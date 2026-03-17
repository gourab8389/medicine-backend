import { db } from "@/config/database";
import { AdminLoginInput } from "./admin.schema";
import { comparePassword } from "@/lib/hash";
import { generateTokenPair, verifyRefreshToken } from "@/lib/jwt";
import { buildPaginatedResult, getPaginationParams } from "@/lib/pagination";

export const AdminService = {
  async login(data: AdminLoginInput) {
    const admin = await db.superAdmin.findUnique({
      where: {
        email: data.email,
      },
    });
    if (!admin) throw new Error("Invalid email");

    const isValid = await comparePassword(data.password, admin.password);
    if (!isValid) throw new Error("Invalid password");

    const tokens = generateTokenPair({
      id: admin.id,
      role: "SUPER_ADMIN",
      email: admin.email,
    });
    const { password: _, ...safeAdmin } = admin;
    return {
      admin: safeAdmin,
      ...tokens,
    };
  },

  async refreshToken(token: string) {
    const decoded = verifyRefreshToken(token);
    if (decoded.role !== "SUPER_ADMIN") throw new Error("Invalid token");
    const admin = await db.superAdmin.findUnique({
      where: {
        id: decoded.id,
      },
    });
    if (!admin) throw new Error("Admin not found");
    return generateTokenPair({
      id: admin.id,
      role: "SUPER_ADMIN",
      email: admin.email,
    });
  },

  // get sellers

  async getSellers(query: {
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
  }) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    return buildPaginatedResult(users, total, page, limit);
  },

  async blacklistUser(id: string) {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw new Error("User not found");
    const newStatus = user.status === "BLACKLISTED" ? "ACTIVE" : "BLACKLISTED";
    return db.user.update({ where: { id }, data: { status: newStatus } });
  },

  // settings

    async getSettings() {
    return db.appSetting.findMany();
  },

  async updateSetting(key: string, value: string) {
    return db.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  },

  // dashboard stats

    async getDashboardStats() {
    const [totalUsers, totalSellers, totalOrders, pendingSellers, totalRevenue, pendingWithdrawals] =
      await Promise.all([
        db.user.count(),
        db.seller.count({ where: { status: "APPROVED" } }),
        db.order.count({ where: { status: { not: "PAYMENT_PENDING" } } }),
        db.seller.count({ where: { status: "PENDING" } }),
        db.payment.aggregate({
          where: { status: "SUCCESS", type: "ORDER" },
          _sum: { amount: true },
        }),
        db.withdrawRequest.count({ where: { status: "PENDING" } }),
      ]);

    return {
      totalUsers,
      totalSellers,
      totalOrders,
      pendingSellers,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      pendingWithdrawals,
    };
  },

};
