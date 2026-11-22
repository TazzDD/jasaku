"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
const back = (v: FormDataEntryValue | null) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/");
const to = (p: string, k: string, m: string): never => redirect(`${p}${p.includes("?") ? "&" : "?"}${k}=${encodeURIComponent(m)}`);

export async function reportContent(fd: FormData) {
  const b = back(fd.get("back"));
  const p = z.object({
    reported_user_id: z.string().uuid(), service_id: z.string().uuid().optional(),
    reason: z.enum(["penipuan", "pelecehan", "spam", "konten_tidak_pantas", "lainnya"]), description: z.string().max(1000).optional(),
  }).safeParse({ reported_user_id: fd.get("reported_user_id"), service_id: fd.get("service_id") || undefined, reason: fd.get("reason"), description: (fd.get("description") as string)?.trim() || undefined });
  if (!p.success) return to(b, "error", "Data laporan tidak valid");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (p.data.reported_user_id === user.id) return to(b, "error", "Tidak dapat melaporkan diri sendiri");
  const { error } = await supabase.from("reports").insert({ ...p.data, service_id: p.data.service_id ?? null, reporter_id: user.id });
  return error ? to(b, "error", "Laporan gagal dikirim") : to(b, "info", "Laporan terkirim. Tim kami akan meninjaunya.");
}

export async function blockUser(fd: FormData) {
  const b = back(fd.get("back"));
  const id = z.string().uuid().safeParse(fd.get("blocked_id"));
  if (!id.success) return to(b, "error", "Data tidak valid");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (id.data === user.id) return to(b, "error", "Tidak dapat memblokir diri sendiri");
  const { error } = await supabase.from("user_blocks").insert({ blocker_id: user.id, blocked_id: id.data });
  return error && error.code !== "23505" ? to(b, "error", "Gagal memblokir") : to(b, "info", "Pengguna diblokir. Mereka tidak dapat memesan atau mengirim pesan kepada Anda.");
}
