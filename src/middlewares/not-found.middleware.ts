import type { Request, Response, NextFunction } from "express";

import { AppError } from "../utils/AppError.js";

export function notFoundMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(new AppError(`Route ${req.originalUrl} tidak ditemukan`, 404));
}
