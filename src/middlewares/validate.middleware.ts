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
