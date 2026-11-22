"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";

const done = (path: string, error?: string): never => { revalidatePath(path); revalidatePath("/"); revalidatePath("/services"); redirect(error ? `${path}?error=${encodeURIComponent(error)}` : path); };
const slugify = (t: string) => t.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export async function adminService(fd: FormData) {
  const { supabase } = await requireRole("admin");
  const p = z.object({ id: z.string().uuid(), op: z.enum(["publish", "reject", "archive", "feature", "unfeature"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return done("/admin/services", "Data tidak valid");
  const patch = { publish: { status: "published" }, reject: { status: "rejected" }, archive: { status: "archived" }, feature: { is_featured: true }, unfeature: { is_featured: false } }[p.data.op];
  const { error } = await supabase.from("services").update(patch).eq("id", p.data.id);
  return done("/admin/services", error?.message);
}

export async function adminCreateCategory(fd: FormData) {
  const { supabase } = await requireRole("admin");
  const p = z.object({ name: z.string().min(2).max(80), parent_id: z.string().uuid().optional(), icon: z.string().max(40).optional() })
    .safeParse({ name: fd.get("name"), parent_id: fd.get("parent_id") || undefined, icon: fd.get("icon") || undefined });
  if (!p.success) return done("/admin/categories", "Nama kategori minimal 2 karakter");
  const slug = slugify(p.data.name) || `kategori-${Date.now()}`;
  const { error } = await supabase.from("categories").insert({ ...p.data, parent_id: p.data.parent_id ?? null, slug });
  return done("/admin/categories", error ? (error.code === "23505" ? "Slug kategori sudah ada" : error.message) : undefined);
}

export async function adminToggleCategory(fd: FormData) {
  const { supabase } = await requireRole("admin");
  const p = z.object({ id: z.string().uuid(), active: z.enum(["true", "false"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return done("/admin/categories", "Data tidak valid");
  const { error } = await supabase.from("categories").update({ is_active: p.data.active === "true" }).eq("id", p.data.id);
  return done("/admin/categories", error?.message);
}

export async function adminSetUserStatus(fd: FormData) {
  const { supabase, user } = await requireRole("admin");
  const p = z.object({ id: z.string().uuid(), status: z.enum(["active", "suspended", "banned"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return done("/admin/users", "Data tidak valid");
  if (p.data.id === user.id) return done("/admin/users", "Tidak dapat mengubah akun sendiri");
  const { error } = await supabase.rpc("admin_set_account_status", { p_user: p.data.id, p_status: p.data.status });
  return done("/admin/users", error?.message);
}

export async function adminReport(fd: FormData) {
  const { supabase } = await requireRole("admin");
  const p = z.object({ id: z.string().uuid(), status: z.enum(["reviewing", "resolved", "dismissed"]), admin_note: z.string().max(1000).optional() })
    .safeParse({ id: fd.get("id"), status: fd.get("status"), admin_note: fd.get("admin_note") || undefined });
  if (!p.success) return done("/admin/reports", "Data tidak valid");
  const { error } = await supabase.from("reports").update({ status: p.data.status, admin_note: p.data.admin_note ?? null }).eq("id", p.data.id);
  return done("/admin/reports", error?.message);
}

export async function adminCancelBooking(fd: FormData) {
  const { supabase } = await requireRole("admin");
  const id = z.string().uuid().safeParse(fd.get("id"));
  if (!id.success) return done("/admin/bookings", "Data tidak valid");
  const { error } = await supabase.rpc("change_booking_status", { p_booking_id: id.data, p_new: "cancelled", p_note: "Dibatalkan oleh admin" });
  return done("/admin/bookings", error?.message);
}

export async function adminDeleteReview(fd: FormData) {
  const { supabase } = await requireRole("admin");
  const id = z.string().uuid().safeParse(fd.get("id"));
  if (!id.success) return done("/admin/reviews", "Data tidak valid");
  const { error } = await supabase.from("reviews").delete().eq("id", id.data);
  return done("/admin/reviews", error?.message);
}
