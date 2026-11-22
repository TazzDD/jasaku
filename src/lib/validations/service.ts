import { z } from "zod";
export const serviceSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter").max(120),
  description: z.string().min(20, "Deskripsi minimal 20 karakter").max(5000),
  category_id: z.string().uuid("Pilih kategori"),
  service_type: z.enum(["service", "rental"]),
  pricing_unit: z.enum(["per_hour", "per_session", "per_day", "per_trip", "per_item", "fixed_price"]),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif").max(1_000_000_000),
  location: z.string().max(120).optional(),
  service_method: z.enum(["online", "offline", "hybrid"]),
});
export const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 6;
