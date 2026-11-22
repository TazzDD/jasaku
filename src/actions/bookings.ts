"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const s = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined; };
const schema = z.object({
  service_id: z.string().uuid(),
  booking_date: z.string().date().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.coerce.number().int().min(1).max(365).default(1),
  rental_start: z.string().date().optional(),
  rental_end: z.string().date().optional(),
  pickup: z.string().max(200).optional(),
  ret: z.string().max(200).optional(),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
  notes: z.string().max(1000).optional(),
});

export async function createBooking(fd: FormData) {
  const slug = s(fd, "slug") ?? "";
  const keys = ["service_id", "booking_date", "start_time", "duration", "rental_start", "rental_end", "pickup", "ret", "quantity", "notes"];
  const p = schema.safeParse(Object.fromEntries(keys.map((k) => [k, s(fd, k)])));
  if (!p.success) redirect(`/services/${slug}?error=${encodeURIComponent("Data pemesanan tidak valid")}`);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/services/${slug}`);
  const d = p.data;
  const { error } = await supabase.rpc("create_booking", {
    p_service_id: d.service_id, p_booking_date: d.booking_date ?? null, p_start_time: d.start_time ?? null,
    p_duration: d.duration, p_rental_start: d.rental_start ?? null, p_rental_end: d.rental_end ?? null,
    p_pickup: d.pickup ?? null, p_return: d.ret ?? null, p_quantity: d.quantity, p_notes: d.notes ?? null,
  });
  if (error) redirect(`/services/${slug}?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard/bookings?info=" + encodeURIComponent("Permintaan terkirim. Menunggu konfirmasi provider."));
}

export async function changeStatus(fd: FormData) {
  const id = z.string().uuid().safeParse(fd.get("id"));
  const status = z.enum(["accepted", "rejected", "confirmed", "in_progress", "completed", "cancelled"]).safeParse(fd.get("status"));
  const back = typeof fd.get("back") === "string" && String(fd.get("back")).startsWith("/") ? String(fd.get("back")) : "/dashboard/bookings";
  if (!id.success || !status.success) redirect(back);
  const supabase = await createClient();
  const { error } = await supabase.rpc("change_booking_status", { p_booking_id: id.data, p_new: status.data });
  revalidatePath(back);
  redirect(error ? `${back}?error=${encodeURIComponent(error.message)}` : back);
}
