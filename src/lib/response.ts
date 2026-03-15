import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  errors?: unknown;
}

export function successResponse<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown
): Response {
  const response: ApiResponse = { success: false, message, errors };
  return res.status(statusCode).json(response);
}

export function createdResponse<T>(res: Response, message: string, data?: T): Response {
  return successResponse(res, message, data, 201);
}

export function notFoundResponse(res: Response, message = "Resource not found"): Response {
  return errorResponse(res, message, 404);
}

export function unauthorizedResponse(res: Response, message = "Unauthorized"): Response {
  return errorResponse(res, message, 401);
}

export function forbiddenResponse(res: Response, message = "Forbidden"): Response {
  return errorResponse(res, message, 403);
}

export function badRequestResponse(res: Response, message: string, errors?: unknown): Response {
  return errorResponse(res, message, 400, errors);
}

export function conflictResponse(res: Response, message: string): Response {
  return errorResponse(res, message, 409);
}
