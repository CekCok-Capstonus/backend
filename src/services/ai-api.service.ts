import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

type MLPredictRequest = {
  text: string;
};

type MLPredictResponse = {
  text: string;
  label: "HOAKS" | "FAKTA";
  confidence: number;
  is_fake: boolean;
  model_scores: {
    bilstm: number;
    gru: number;
    cnn_bilstm: number;
  };
};

export async function predictNews(
  content: string,
): Promise<{ label: "hoax" | "valid"; confidence_score: number }> {
  if (!env.AI_API_URL) {
    throw new AppError("AI API URL tidak dikonfigurasi", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_API_TIMEOUT);

  try {
    const response = await fetch(`${env.AI_API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: content } satisfies MLPredictRequest),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(`AI API Error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as MLPredictResponse;
    return {
      label: data.label === "HOAKS" ? "hoax" : "valid",
      confidence_score: data.confidence,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if ((error as Error).name === "AbortError") {
      throw new AppError("AI API timeout", 504);
    }

    throw new AppError(
      `Gagal menghubungi AI API: ${(error as Error).message}`,
      500,
    );
  } finally {
    clearTimeout(timeout);
  }
}
