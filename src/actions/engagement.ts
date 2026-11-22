"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function me() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
const go = (path: string, k: "error" | "info", m: string): never => redirect(`${path}?${k}=${encodeURIComponent(m)}`);

export async function createReview(fd: FormData) {
  const p = z.object({ booking_id: z.string().uuid(), rating: z.coerce.number().int().min(1).max(5), comment: z.string().max(1000).optional() })
    .safeParse({ booking_id: fd.get("booking_id"), rating: fd.get("rating"), comment: (fd.get("comment") as string)?.trim() || undefined });
  if (!p.success) return go("/dashboard/bookings", "error", "Rating harus 1 sampai 5");
  const { supabase, user } = await me();
  // provider_id & service_id diisi trigger database dari booking (anti-manipulasi)
  const { error } = await supabase.from("reviews").insert({ booking_id: p.data.booking_id, customer_id: user.id, rating: p.data.rating, comment: p.data.comment ?? null });
  if (error) return go("/dashboard/bookings", "error", error.code === "23505" ? "Pesanan ini sudah diulas" : "Ulasan tidak dapat dikirim");
  revalidatePath("/services");
  return go("/dashboard/bookings", "info", "Terima kasih atas ulasan Anda");
}

export async function replyReview(fd: FormData) {
  const p = z.object({ id: z.string().uuid(), reply: z.string().trim().min(1).max(1000) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return go("/provider/reviews", "error", "Balasan tidak valid");
  const { supabase, user } = await me();
  const { error } = await supabase.from("reviews").update({ provider_reply: p.data.reply }).eq("id", p.data.id).eq("provider_id", user.id);
  revalidatePath("/provider/reviews"); revalidatePath("/services");
  return error ? go("/provider/reviews", "error", "Gagal membalas") : go("/provider/reviews", "info", "Balasan terkirim");
}

export async function toggleFavorite(fd: FormData) {
  const id = z.string().uuid().safeParse(fd.get("service_id"));
  const slug = String(fd.get("slug") ?? "");
  if (!id.success) redirect("/services");
  const { supabase, user } = await me();
  const { data: ex } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("service_id", id.data).maybeSingle();
  if (ex) await supabase.from("favorites").delete().eq("id", ex.id);
  else await supabase.from("favorites").insert({ user_id: user.id, service_id: id.data });
  revalidatePath("/dashboard/favorites");
  redirect(slug ? `/services/${encodeURIComponent(slug)}` : "/dashboard/favorites");
}

export async function markAllNotificationsRead() {
  const { supabase, user } = await me();
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  revalidatePath("/dashboard/notifications");
  redirect("/dashboard/notifications");
}
