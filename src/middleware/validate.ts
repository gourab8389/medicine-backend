import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { badRequestResponse } from "../lib/response";

type ValidationTarget = "body" | "query" | "params";

export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      badRequestResponse(res, "Validation failed", errors);
      return;
    }
    req[target] = result.data;
    next();
  };
}
