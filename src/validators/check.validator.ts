import { z } from "zod";

export const createTextCheckSchema = z.object({
  content: z
    .string()
    .trim()
    .min(20, "Konten berita minimal 20 karakter")
    .max(10000, "Konten berita maksimal 10000 karakter"),
  title: z.string().trim().max(255).optional(),
});
