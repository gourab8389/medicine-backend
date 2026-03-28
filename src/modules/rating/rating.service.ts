import { db } from "../../config/database";
import { CreateRatingInput } from "./rating.schema";
import { getPaginationParams, buildPaginatedResult } from "../../lib/pagination";

export const RatingService = {
  /**
   * User rates all sellers in an order with the same rating
   * One rating per order per seller
   */
  async create(userId: string, data: CreateRatingInput) {
    const order = await db.order.findFirst({
      where: { id: data.orderId, userId, status: "DELIVERED" },
      include: {
        orderItems: { select: { sellerId: true }, distinct: ["sellerId"] },
      },
    });

    if (!order) throw new Error("Order not found or not yet delivered");

    // Check if already rated
    const existingRating = await db.rating.findFirst({ where: { orderId: data.orderId, userId } });
    if (existingRating) throw new Error("You have already rated this order");

    // Create ratings for all sellers in the order with the same rating
    const sellerIds = order.orderItems.map((item) => item.sellerId);
    const ratings = await db.$transaction(
      sellerIds.map((sellerId) =>
        db.rating.create({
          data: { userId, sellerId, orderId: data.orderId, rating: data.rating, review: data.review },
        })
      )
    );

    return ratings;
  },

  async getSellerRatings(sellerId: string, query: { page?: string; limit?: string }) {
    const { skip, take, page, limit } = getPaginationParams(query);

    const [ratings, total, avgResult] = await Promise.all([
      db.rating.findMany({
        where: { sellerId },
        skip,
        take,
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.rating.count({ where: { sellerId } }),
      db.rating.aggregate({ where: { sellerId }, _avg: { rating: true } }),
    ]);

    return {
      ...buildPaginatedResult(ratings, total, page, limit),
      averageRating: avgResult._avg.rating ? Number(avgResult._avg.rating.toFixed(1)) : 0,
    };
  },
};
