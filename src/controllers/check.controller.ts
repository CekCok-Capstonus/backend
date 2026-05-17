import type { Request, Response } from "express";

import {
  createTextCheck,
  createUrlCheck,
  getCheckById,
  getChecks,
  updateCheckResult,
} from "../repositories/check.repository.js";
import { AppError } from "../utils/AppError.js";
import { extractArticleFromUrl } from "../services/article-extractor.service.js";
import { predictNews } from "../services/ai-api.service.js";

export async function createTextCheckController(req: Request, res: Response) {
  const { title, content } = req.body as { title?: string; content: string };

  const check = await createTextCheck({ title: title ?? "", content });

  // AI prediction
  try {
    console.log(`[AI] Starting prediction for check ${check.id}`);
    const prediction = await predictNews(content);
    console.log(
      `[AI] Prediction success for check ${check.id}:`,
      prediction.label,
    );

    const updatedCheck = await updateCheckResult({
      id: check.id,
      label: prediction.label,
      confidence_score: prediction.confidence_score,
      status: "success",
      explanation: prediction.explanation,
    });

    console.log(`[AI] Database updated for check ${check.id}`);

    res.status(201).json({
      success: true,
      message: "Pengecekan berita berhasil dibuat",
      data: updatedCheck,
    });
  } catch (error) {
    console.error(`[AI] Error for check ${check.id}:`, error);

    const failedCheck = await updateCheckResult({
      id: check.id,
      label: "hoax",
      confidence_score: 0,
      status: "fail",
      error_message:
        error instanceof AppError ? error.message : "Gagal melakukan prediksi",
    });

    res.status(201).json({
      success: true,
      message: "Pengecekan berita berhasil dibuat",
      data: failedCheck,
    });
  }
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

export async function getCheckByIdController(req: Request, res: Response) {
  const { id } = res.locals.params as { id: string };

  const check = await getCheckById(id);

  if (!check) {
    throw new AppError("Data pengecekan tidak ditemukan", 404);
  }

  res.status(200).json({
    success: true,
    message: "Detail pengecekan berhasil diambil",
    data: check,
  });
}

export async function createUrlCheckController(req: Request, res: Response) {
  const { url } = req.body as { url: string };

  const article = await extractArticleFromUrl(url);

  const check = await createUrlCheck({
    source_url: url,
    title: article.title,
    content: article.content,
  });

  // AI prediction
  try {
    console.log(`[AI] Starting prediction for check ${check.id}`);
    const prediction = await predictNews(article.content);
    console.log(
      `[AI] Prediction success for check ${check.id}:`,
      prediction.label,
    );

    const updatedCheckResult = await updateCheckResult({
      id: check.id,
      label: prediction.label,
      confidence_score: prediction.confidence_score,
      status: "success",
      explanation: prediction.explanation,
    });

    console.log(`[AI] Database updated for check ${check.id}`);

    res.status(201).json({
      success: true,
      message: "Pengecekan berita dari URL berhasil dibuat",
      data: check,
      extraction: {
        source: article.source,
        published: article.published,
        quality: article.quality,
      },
      steps: [
        ...article.steps,
        {
          key: "ai_check",
          label: "Menunggu proses pengecekan AI",
          status: "warning",
        },
      ],
    });
  } catch (error) {
    console.error(`[AI] Error for check ${check.id}:`, error);

    const failedCheck = await updateCheckResult({
      id: check.id,
      label: "hoax",
      confidence_score: 0,
      status: "fail",
      error_message:
        error instanceof AppError ? error.message : "Gagal melakukan prediksi",
    });

    res.status(201).json({
      success: true,
      message: "Pengecekan berita dari URL berhasil dibuat",
      data: failedCheck,
      extraction: {
        source: article.source,
        published: article.published,
        quality: article.quality,
      },
      steps: [
        ...article.steps,
        {
          key: "ai_check",
          label: "Pengecekan AI gagal",
          status: "fail",
        },
      ],
    });
  }
}
