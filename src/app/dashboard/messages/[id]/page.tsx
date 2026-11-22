import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import ReportBlock from "@/components/ReportBlock";
import ChatPanel from "@/components/ChatPanel";
export const metadata = { title: "Percakapan" };
export default async function Chat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user } = await requireUser();
  const { data: conv } = await supabase.from("conversations").select("id,customer_id,provider_id").eq("id", id).maybeSingle(); // RLS: hanya peserta
  if (!conv) notFound();
  const oid = conv.customer_id === user.id ? conv.provider_id : conv.customer_id;
  const [{ data: other }, { data: msgs }] = await Promise.all([
    supabase.from("public_profiles").select("full_name").eq("id", oid).maybeSingle(),
    supabase.from("messages").select("id,sender_id,message,created_at,is_read").eq("conversation_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/dashboard/messages" className="text-sm text-brand-teal underline">← Semua pesan</Link>
      <h1 className="my-3 text-xl font-bold text-brand-dark">{other?.full_name ?? "Pengguna"}</h1>
      <ReportBlock userId={oid} back={`/dashboard/messages/${id}`} />
      <div className="mt-3" />
      <ChatPanel conversationId={id} userId={user.id} initial={(msgs ?? []).reverse()} />
    </div>
  );
}
