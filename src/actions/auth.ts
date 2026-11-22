"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const email = z.string().email("Email tidak valid");
const password = z.string().min(8, "Password minimal 8 karakter");
const back = (path: string, msg: string): never => redirect(`${path}?error=${encodeURIComponent(msg)}`);
const safeNext = (n: FormDataEntryValue | null) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

export async function login(fd: FormData) {
  const p = z.object({ email, password: z.string().min(1) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return back("/login", p.error.issues[0].message);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(p.data);
  if (error) return back("/login", "Email atau password salah");
  redirect(safeNext(fd.get("next")));
}

export async function register(fd: FormData) {
  const p = z.object({ full_name: z.string().min(2, "Nama terlalu pendek").max(100), email, password }).safeParse(Object.fromEntries(fd));
  if (!p.success) return back("/register", p.error.issues[0].message);
  if (fd.get("adult") !== "on") return back("/register", "Anda harus berusia 18 tahun ke atas");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: p.data.email, password: p.data.password,
    options: { data: { full_name: p.data.full_name }, emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });
  if (error) return back("/register", error.message);
  redirect("/login?info=" + encodeURIComponent("Cek email Anda untuk verifikasi, lalu login."));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPassword(fd: FormData) {
  const e = email.safeParse(fd.get("email"));
  if (!e.success) return back("/forgot-password", "Email tidak valid");
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(e.data, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password` });
  redirect("/forgot-password?info=" + encodeURIComponent("Jika email terdaftar, tautan reset telah dikirim."));
}

export async function resetPassword(fd: FormData) {
  const p = password.safeParse(fd.get("password"));
  if (!p.success) return back("/reset-password", p.error.issues[0].message);
  if (fd.get("password") !== fd.get("confirm")) return back("/reset-password", "Konfirmasi password tidak cocok");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: p.data });
  if (error) return back("/reset-password", "Tautan kedaluwarsa. Ulangi permintaan reset.");
  redirect("/dashboard");
}
