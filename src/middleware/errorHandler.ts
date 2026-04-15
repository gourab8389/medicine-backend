import { Request, Response, NextFunction } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { env } from "../config/env";
import { Prisma } from "../../generated/prisma/client";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(`Error on ${req.method} ${req.path}: ${err.message}`, {
    stack: err.stack,
    body: req.body,
  });

  // Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  // JWT errors
  if (err instanceof TokenExpiredError) {
    res.status(401).json({ success: false, message: "Token has expired" });
    return;
  }
  if (err instanceof JsonWebTokenError) {
    res.status(401).json({ success: false, message: "Invalid token" });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = (err.meta?.target as string[])?.join(", ") || "field";
      res.status(409).json({ success: false, message: `${field} already exists` });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ success: false, message: "Record not found" });
      return;
    }
    if (err.code === "P2003") {
      res.status(400).json({ success: false, message: "Related record not found" });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, message: "Invalid data provided" });
    return;
  }

  // CORS error
  if (err.message.startsWith("CORS:")) {
    res.status(403).json({ success: false, message: err.message });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(env.NODE_ENV === "development" && { stack: err.stack, detail: err.message }),
  });
}
