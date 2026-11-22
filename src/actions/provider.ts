"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceSchema as schema, IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGES } from "@/lib/validations/service";

export async function activateProvider(fd: FormData) {
  const name = z.string().min(2).max(100).safeParse(fd.get("business_name"));
  if (!name.success) redirect("/dashboard?error=" + encodeURIComponent("Nama usaha minimal 2 karakter"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("become_provider", { p_business_name: name.data });
  redirect(error ? "/dashboard?error=" + encodeURIComponent(error.message) : "/provider");
}

const slugify = (t: string) => t.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export async function createService(fd: FormData) {
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) redirect("/provider/services/create?error=" + encodeURIComponent(p.error.issues[0].message));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const slug = `${slugify(p.data.title) || "layanan"}-${Math.random().toString(36).slice(2, 7)}`;
  const { error } = await supabase.from("services").insert({ ...p.data, location: p.data.location || null, slug, provider_id: user.id, status: "pending_review" });
  redirect(error ? "/provider/services/create?error=" + encodeURIComponent("Gagal menyimpan layanan") : "/provider?info=" + encodeURIComponent("Layanan dikirim untuk ditinjau admin."));
}

const editUrl = (id: string, k?: "error" | "info", m?: string) => `/provider/services/${id}/edit${k ? `?${k}=${encodeURIComponent(m ?? "")}` : ""}`;
const idOf = (v: FormDataEntryValue | null) => z.string().uuid().safeParse(v);

export async function updateService(fd: FormData) {
  const id = idOf(fd.get("id"));
  if (!id.success) redirect("/provider");
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) redirect(editUrl(id.data, "error", p.error.issues[0].message));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Edit mengembalikan layanan ke antrean review admin
  const { data, error } = await supabase.from("services")
    .update({ ...p.data, location: p.data.location || null, status: "pending_review" })
    .eq("id", id.data).eq("provider_id", user.id).select("id");
  if (error || !data?.length) redirect(editUrl(id.data, "error", "Gagal menyimpan perubahan"));
  revalidatePath("/services");
  redirect(`/provider?info=${encodeURIComponent("Perubahan disimpan dan dikirim untuk ditinjau ulang.")}`);
}

export async function archiveService(fd: FormData) {
  const id = idOf(fd.get("id"));
  if (!id.success) redirect("/provider");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("services").update({ status: "archived" }).eq("id", id.data).eq("provider_id", user.id);
  revalidatePath("/services"); revalidatePath("/");
  redirect(`/provider?${error ? "error" : "info"}=${encodeURIComponent(error ? "Gagal mengarsipkan" : "Layanan diarsipkan.")}`);
}

export async function uploadServiceImage(fd: FormData) {
  const id = idOf(fd.get("id"));
  if (!id.success) redirect("/provider");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) redirect(editUrl(id.data, "error", "Pilih file gambar"));
  const f = file as File;
  const ext = IMAGE_TYPES[f.type];
  if (!ext) redirect(editUrl(id.data, "error", "Format harus JPG, PNG, atau WebP"));
  if (f.size > MAX_IMAGE_BYTES) redirect(editUrl(id.data, "error", "Ukuran maksimal 5 MB"));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: svc } = await supabase.from("services").select("id").eq("id", id.data).eq("provider_id", user.id).maybeSingle();
  if (!svc) redirect("/provider");
  const { count } = await supabase.from("service_images").select("id", { count: "exact", head: true }).eq("service_id", id.data);
  if ((count ?? 0) >= MAX_IMAGES) redirect(editUrl(id.data, "error", `Maksimal ${MAX_IMAGES} gambar`));
  // Verifikasi signature file (bukan hanya mime dari browser)
  const head = new Uint8Array(await f.slice(0, 12).arrayBuffer());
  const ok = (ext === "jpg" && head[0] === 0xff && head[1] === 0xd8) || (ext === "png" && head[0] === 0x89 && head[1] === 0x50) ||
    (ext === "webp" && String.fromCharCode(...head.slice(0, 4)) === "RIFF" && String.fromCharCode(...head.slice(8, 12)) === "WEBP");
  if (!ok) redirect(editUrl(id.data, "error", "File bukan gambar yang valid"));
  const path = `${user.id}/${id.data}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("service-images").upload(path, f, { contentType: f.type, upsert: false });
  if (up.error) redirect(editUrl(id.data, "error", "Upload gagal"));
  const url = supabase.storage.from("service-images").getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("service_images").insert({ service_id: id.data, image_url: url, display_order: count ?? 0 });
  if (error) { await supabase.storage.from("service-images").remove([path]); redirect(editUrl(id.data, "error", "Gagal menyimpan gambar")); }
  redirect(editUrl(id.data, "info", "Gambar ditambahkan"));
}

export async function deleteServiceImage(fd: FormData) {
  const sid = idOf(fd.get("service_id")), iid = idOf(fd.get("image_id"));
  if (!sid.success || !iid.success) redirect("/provider");
  const supabase = await createClient();
  const { data: img } = await supabase.from("service_images").select("image_url").eq("id", iid.data).eq("service_id", sid.data).maybeSingle();
  if (img) {
    const { error } = await supabase.from("service_images").delete().eq("id", iid.data); // RLS: hanya pemilik layanan
    const path = img.image_url.split("/service-images/")[1];
    if (!error && path) await supabase.storage.from("service-images").remove([decodeURIComponent(path)]);
  }
  redirect(editUrl(sid.data, "info", "Gambar dihapus"));
}

export async function addAvailability(fd: FormData) {
  const p = z.object({
    service_id: z.string().uuid(), available_date: z.string().date(),
    start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(), end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    is_available: z.enum(["true", "false"]),
  }).safeParse({ service_id: fd.get("service_id"), available_date: fd.get("available_date"), start_time: fd.get("start_time") || undefined, end_time: fd.get("end_time") || undefined, is_available: fd.get("is_available") });
  if (!p.success) redirect("/provider/schedule?error=" + encodeURIComponent("Data jadwal tidak valid"));
  if (p.data.start_time && p.data.end_time && p.data.end_time <= p.data.start_time) redirect("/provider/schedule?error=" + encodeURIComponent("Jam selesai harus setelah jam mulai"));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("service_availability").insert({
    service_id: p.data.service_id, provider_id: user.id, available_date: p.data.available_date,
    start_time: p.data.start_time ?? null, end_time: p.data.end_time ?? null, is_available: p.data.is_available === "true",
  });
  redirect("/provider/schedule" + (error ? "?error=" + encodeURIComponent("Gagal menyimpan jadwal") : "?info=" + encodeURIComponent("Jadwal ditambahkan")));
}

export async function deleteAvailability(fd: FormData) {
  const id = z.string().uuid().safeParse(fd.get("id"));
  if (id.success) { const supabase = await createClient(); await supabase.from("service_availability").delete().eq("id", id.data); }
  redirect("/provider/schedule");
}
