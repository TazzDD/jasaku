import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
export const metadata = { title: "Pesan" };
export default async function Messages() {
  const { supabase, user } = await requireUser();
  const { data: convs } = await supabase.from("conversations").select("id,customer_id,provider_id,created_at").order("created_at", { ascending: false }).limit(50);
  const ids = (convs ?? []).map((c) => c.id);
  const others = (convs ?? []).map((c) => (c.customer_id === user.id ? c.provider_id : c.customer_id));
  const [{ data: profs }, { data: unread }] = await Promise.all([
    others.length ? supabase.from("public_profiles").select("id,full_name").in("id", others) : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    ids.length ? supabase.from("messages").select("conversation_id").in("conversation_id", ids).eq("is_read", false).neq("sender_id", user.id) : Promise.resolve({ data: [] as { conversation_id: string }[] }),
  ]);
  const unreadBy = new Map<string, number>();
  unread?.forEach((m) => unreadBy.set(m.conversation_id, (unreadBy.get(m.conversation_id) ?? 0) + 1));
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-dark">Pesan</h1>
      {!convs?.length && <p className="mt-6 rounded-2xl bg-white p-8 text-center text-ink/70">Belum ada percakapan. Mulai dari halaman detail layanan.</p>}
      <ul className="mt-4 space-y-2">{convs?.map((c) => {
        const oid = c.customer_id === user.id ? c.provider_id : c.customer_id;
        const n = unreadBy.get(c.id) ?? 0;
        return (
          <li key={c.id}><Link href={`/dashboard/messages/${c.id}`} className="flex items-center justify-between rounded-xl bg-white p-4 hover:shadow">
            <span className="font-semibold text-brand-dark">{profs?.find((p) => p.id === oid)?.full_name ?? "Pengguna"}</span>
            {n > 0 && <span className="rounded-full bg-brand-accent px-2 py-0.5 text-xs text-white">{n} baru</span>}
          </Link></li>);
      })}</ul>
    </div>
  );
}
