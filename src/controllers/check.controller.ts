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

  res.status(201).json({
    success: true,
    message: "Pengecekan berita berhasil dibuat",
    data: check,
  });

  // background AI prediction
  (async () => {
    try {
      const prediction = await predictNews(content);
      await updateCheckResult({
        id: check.id,
        label: prediction.label,
        confidence_score: prediction.confidence_score,
        status: "success",
        explanation: prediction.explanation,
      });
    } catch (error) {
      await updateCheckResult({
        id: check.id,
        label: "hoax",
        confidence_score: 0,
        status: "fail",
        error_message:
          error instanceof AppError
            ? error.message
            : "Gagal melakukan prediksi",
      });
    }
  })();
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

  // background AI prediction
  (async () => {
    try {
      const prediction = await predictNews(article.content);
      await updateCheckResult({
        id: check.id,
        label: prediction.label,
        confidence_score: prediction.confidence_score,
        status: "success",
        explanation: prediction.explanation,
      });
    } catch (error) {
      await updateCheckResult({
        id: check.id,
        label: "hoax",
        confidence_score: 0,
        status: "fail",
        error_message:
          error instanceof AppError
            ? error.message
            : "Gagal melakukan prediksi",
      });
    }
  })();
}
