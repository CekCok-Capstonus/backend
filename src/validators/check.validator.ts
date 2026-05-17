import { z } from "zod";

export const createTextCheckSchema = z.object({
  content: z
    .string()
    .trim()
    .min(20, "Konten berita minimal 20 karakter")
    .max(10000, "Konten berita maksimal 10000 karakter"),
  title: z.string().trim().max(255).optional(),
});

export const getChecksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().optional(),
  label: z.enum(["hoax", "valid"]).optional(),
  sort_by: z
    .enum(["newest", "oldest", "confidence_high", "confidence_low"])
    .default("newest"),
});

export const checkIdParamSchema = z.object({
  id: z.uuid("ID tidak valid"),
});

export const createUrlCheckSchema = z.object({
  url: z.url("URL tidak valid"),
});
