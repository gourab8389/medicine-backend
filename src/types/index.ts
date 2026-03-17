import { Request } from "express";


export type JwtPayload = {
  id: string;
  role: "SUPER_ADMIN" | "SELLER" | "USER";
  email: string;
};

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  addressId: string;
  items: OrderItemInput[];
  prescriptionId?: string;
  notes?: string;
}

export type WalletTransactionType = "CREDIT" | "DEBIT";

export interface AppSettings {
  GST_PERCENTAGE: number;
  DELIVERY_CHARGE: number;
  FREE_DELIVERY_ABOVE: number;
  MONTHLY_SUBSCRIPTION_AMOUNT: number;
  SELLER_WITHDRAW_MINIMUM: number;
}
