import type { Request, Response } from "express";

import { createTextCheck } from "../repositories/check.repository.js";

export async function createTextCheckController(req: Request, res: Response) {
  const check = await createTextCheck(req.body);

  res.status(201).json({
    success: true,
    message: "Pengecekan berita berhasil dibuat",
    data: check,
  });
}
