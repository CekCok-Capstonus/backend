import type { Request, Response } from "express";

import { getAnalyticsSummary } from "../repositories/analytics.repository.js";

export async function getAnalyticsSummaryController(
  _req: Request,
  res: Response,
) {
  const summary = await getAnalyticsSummary();

  res.status(200).json({
    success: true,
    message: "Ringkasan analytics berhasil diambil",
    data: summary,
  });
}
