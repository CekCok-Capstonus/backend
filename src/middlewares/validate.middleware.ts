import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";

import { AppError } from "../utils/AppError.js";

export function validateBody(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues[0]?.message || "Input tidak valid";
      next(new AppError(message, 400));
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const message = result.error.issues[0]?.message || "Query tidak valid";
      next(new AppError(message, 400));
      return;
    }

    // assign hasil validasi ke lokal karena req.query di express tidak bisa dioverwrite
    res.locals.query = result.data;
    next();
  };
}
