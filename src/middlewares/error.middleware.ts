import type { Request, Response, NextFunction } from "express";

type ErrorWithStatus = Error & {
  statusCode?: number;
};

export function errorMiddleware(
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Terjadi kesalahan di server kami",
  });
}
