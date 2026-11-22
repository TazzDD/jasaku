"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function startChat(fd: FormData) {
  const other = z.string().uuid().safeParse(fd.get("other_id"));
  const slug = String(fd.get("slug") ?? "");
  if (!other.success) redirect("/dashboard/messages");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/services/${encodeURIComponent(slug)}`);
  const { data, error } = await supabase.rpc("get_or_create_conversation", { p_other: other.data });
  if (error || !data) redirect(`/services/${encodeURIComponent(slug)}?error=${encodeURIComponent(error?.message ?? "Gagal memulai chat")}`);
  redirect(`/dashboard/messages/${data}`);
}

export async function sendMessage(conversationId: string, text: string) {
  const p = z.object({ id: z.string().uuid(), text: z.string().trim().min(1).max(2000) }).safeParse({ id: conversationId, text });
  if (!p.success) return { error: "Pesan tidak valid" as const };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Silakan masuk kembali" as const };
  const { data, error } = await supabase.from("messages")
    .insert({ conversation_id: p.data.id, sender_id: user.id, message: p.data.text })
    .select("id,sender_id,message,created_at,is_read").single();
  if (error) return { error: "Pesan gagal dikirim" as const };
  return { message: data };
}

export async function markRead(conversationId: string) {
  if (!z.string().uuid().safeParse(conversationId).success) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("messages").update({ is_read: true }).eq("conversation_id", conversationId).neq("sender_id", user.id).eq("is_read", false);
}
