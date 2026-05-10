import type { Request, Response } from "express";

import {
  createTextCheck,
  getChecks,
} from "../repositories/check.repository.js";

export async function createTextCheckController(req: Request, res: Response) {
  const check = await createTextCheck(req.body);

  res.status(201).json({
    success: true,
    message: "Pengecekan berita berhasil dibuat",
    data: check,
  });
}

export async function getChecksController(req: Request, res: Response) {
  const result = await getChecks(res.locals.query);

  res.status(200).json({
    success: true,
    message: "Daftar riwayat pengecekan berhasil diambil",
    data: result.data,
    pagination: result.pagination,
  });
}
