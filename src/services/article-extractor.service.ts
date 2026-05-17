import { extract } from "@extractus/article-extractor";
import { convert } from "html-to-text";
import dns from "node:dns/promises";
import ipaddr from "ipaddr.js";

import { AppError } from "../utils/AppError.js";

type ExtractionQuality = "clean" | "dirty" | "unsupported";

type ProcessStep = {
  key: "visit_url" | "extract_title" | "extract_content" | "clean_content";
  label: string;
  status: "success" | "warning" | "fail";
};

type ExtractedArticle = {
  title: string | null;
  content: string;
  source: string | null;
  published: string | null;
  quality: ExtractionQuality;
  steps: ProcessStep[];
};

function isBlockedIp(ip: string) {
  const addr = ipaddr.parse(ip);
  const range = addr.range();

  return [
    "unspecified",
    "broadcast",
    "multicast",
    "linkLocal",
    "loopback",
    "private",
    "reserved",
    "uniqueLocal",
  ].includes(range);
}

async function validatePublicUrl(url: string) {
  const parsed = new URL(url);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new AppError("URL harus menggunakan http atau https", 400);
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostname === "localhost") {
    throw new AppError("URL tidak diizinkan", 400);
  }

  try {
    if (ipaddr.isValid(hostname)) {
      if (isBlockedIp(hostname)) {
        throw new AppError("URL tidak diizinkan", 400);
      }

      return;
    }

    // Skip DNS lookup di production untuk avoid timeout
    if (process.env.NODE_ENV === "production") {
      console.log(`[Production] Skipping DNS lookup for ${hostname}`);
      return;
    }

    const addresses = await dns.lookup(hostname, { all: true });

    if (addresses.length === 0) {
      throw new AppError("Host URL tidak ditemukan", 400);
    }

    for (const address of addresses) {
      if (isBlockedIp(address.address)) {
        throw new AppError("URL tidak diizinkan", 400);
      }
    }
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    console.error(`DNS lookup error for ${hostname}:`, err);
    throw new AppError("Host URL tidak valid atau tidak dapat diakses", 400);
  }
}

function detectNoise(text: string) {
  const patterns = [
    /ADVERTISEMENT/gi,
    /Scroll ke bawah untuk melanjutkan membaca/gi,
    /IKLAN/gi,
    /SCROLL TO CONTINUE/gi,
    /GULIR UNTUK LANJUT BACA/gi,
    /Baca Juga/gi,
    /Berlangganan/gi,
    /Bagikan/gi,
    /Dengarkan artikel/gi,
    /Tampilkan Ringkasan Artikel/gi,
    /Add as a preferred source on Google/gi,
    /\[Gambas:[^\]]+\]/gi,
  ];

  return patterns.reduce((count, pattern) => {
    return count + (text.match(pattern)?.length ?? 0);
  }, 0);
}

function trimBeforeArticleLead(text: string) {
  const markers = [
    "VIVA –",
    "Jakarta -",
    "JAKARTA, KOMPAS.com",
    "Jakarta, CNN Indonesia",
    "Jakarta (ANTARA)",
    "Suara.com -",
    "Liputan6.com, Jakarta",
    "TRIBUNNEWS.COM",
  ];

  for (const marker of markers) {
    const index = text.indexOf(marker);
    if (index > 0 && index < 300) {
      return text.slice(index);
    }
  }

  return text;
}

function removeNoise(text: string) {
  return text
    .replace(/ADVERTISEMENT/gi, "")
    .replace(/Scroll ke bawah untuk melanjutkan membaca/gi, "")
    .replace(/SCROLL TO CONTINUE WITH CONTENT/gi, "")
    .replace(/GULIR UNTUK LANJUT BACA/gi, "")
    .replace(/\bIklan\b/gi, "")
    .replace(/\bBaca Juga\b/gi, "")
    .replace(/\bBagikan\b/gi, "")
    .replace(/\bDengarkan artikel\b/gi, "")
    .replace(/\bTampilkan Ringkasan Artikel\b/gi, "")
    .replace(/Add as a preferred source on Google/gi, "")
    .replace(/\[Gambas:[^\]]+\]/gi, "")
    .replace(/Copyright © ANTARA.*$/gi, "")
    .replace(/[]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToPlainText(html: string) {
  return convert(html, {
    wordwrap: false,
    selectors: [
      {
        selector: "img",
        format: "skip",
      },
      {
        selector: "a",
        options: { ignoreHref: true },
      },
    ],
  })
    .replace(/\s+/g, " ")
    .trim();
}

export async function extractArticleFromUrl(
  url: string,
): Promise<ExtractedArticle> {
  await validatePublicUrl(url);

  const steps: ProcessStep[] = [];
  const parsedUrl = new URL(url);
  const source = parsedUrl.hostname.replace("www.", "");

  steps.push({
    key: "visit_url",
    label: `Mengunjungi ${source}`,
    status: "success",
  });

  try {
    const article = await extract(
      url,
      {
        contentLengthThreshold: 100,
        descriptionLengthThreshold: 80,
      },
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          Referer: "https://www.google.com/",
        },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!article || !article.content) {
      steps.push({
        key: "extract_content",
        label: "Gagal mengekstrak konten",
        status: "fail",
      });

      throw new AppError(
        "Konten artikel tidak dapat diekstrak. Silahkan salin teks berita secara manual.",
        422,
      );
    }

    steps.push({
      key: "extract_title",
      label: article.title
        ? "Judul artikel berhasil ditemukan"
        : "Judul artikel tidak ditemukan",
      status: article.title ? "success" : "warning",
    });

    steps.push({
      key: "extract_content",
      label: "Isi konten berhasil diekstrak",
      status: "success",
    });

    const plainText = htmlToPlainText(article.content);
    const cleanText = trimBeforeArticleLead(removeNoise(plainText)).slice(
      0,
      10000,
    );
    const noiseHits = detectNoise(cleanText);

    const quality: ExtractionQuality =
      cleanText.length < 300
        ? "unsupported"
        : noiseHits >= 6
          ? "dirty"
          : "clean";

    if (quality === "unsupported") {
      throw new AppError("URL yang kamu masukkan belum kami dukung", 422);
    }

    steps.push({
      key: "clean_content",
      label:
        quality === "clean"
          ? "Konten berhasil dibersihkan"
          : "URL didukung sebagian, konten mungkin sedikit kotor",
      status: quality === "clean" ? "success" : "warning",
    });

    return {
      title: article.title?.trim() || null,
      content: cleanText,
      source: article.source ?? null,
      published: article.published ?? null,
      quality,
      steps,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("403")) {
      throw new AppError(
        `Situs ${source} tidak dapat diakses saat ini. Silakan gunakan situs berita lain atau salin teks berita secara manual untuk pengecekan.`,
        422,
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AppError(
        `Waktu akses ke ${source} habis. Silakan coba lagi atau gunakan situs berita lain.`,
        422,
      );
    }

    if (
      error instanceof Error &&
      (error.message.includes("fetch") || error.message.includes("network"))
    ) {
      throw new AppError(
        `Gagal mengakses ${source}. Periksa koneksi internet atau coba situs berita lain.`,
        422,
      );
    }

    if (error instanceof AppError) {
      throw error;
    }

    console.error("[Extract] Error:", error);
    throw new AppError(
      `Gagal mengekstrak artikel dari ${source}. Silakan salin teks berita secara manual untuk pengecekan.`,
      422,
    );
  }
}
