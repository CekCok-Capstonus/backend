import type { Request, Response } from "express";

import { pool } from "../config/db.js";

export function healthCheck(_req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: "Server berfungsi dengan baik",
  });
}

export async function dbHealthCheck(_req: Request, res: Response) {
  const result = await pool.query("SELECT NOW()");

  res.status(200).json({
    success: true,
    message: "Database berfungsi dengan baik",
    data: {
      now: result.rows[0].now,
    },
  });
}
