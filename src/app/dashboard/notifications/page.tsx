import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { markAllNotificationsRead } from "@/actions/engagement";
export const metadata = { title: "Notifikasi" };
const href = (type: string | null, id: string | null) => (type === "message" && id ? `/dashboard/messages/${id}` : "/dashboard/bookings");
export default async function Page() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("notifications").select("id,title,message,type,related_id,is_read,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  const unread = data?.filter((n) => !n.is_read).length ?? 0;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-brand-dark">Notifikasi</h1>
        {unread > 0 && <form action={markAllNotificationsRead}><button className="btn btn-outline !min-h-9">Tandai semua dibaca</button></form>}</div>
      {!data?.length && <p className="mt-6 rounded-2xl bg-white p-8 text-center text-ink/70">Belum ada notifikasi.</p>}
      <ul className="mt-4 space-y-2">{data?.map((n) => (
        <li key={n.id}><Link href={href(n.type, n.related_id)} className={`block rounded-xl p-4 ${n.is_read ? "bg-white" : "border-l-4 border-brand-teal bg-brand-cyan/40"}`}>
          <p className="font-semibold text-brand-dark">{n.title}</p><p className="text-sm">{n.message}</p>
          <p className="text-xs text-ink/50">{new Date(n.created_at).toLocaleString("id-ID")}</p></Link></li>))}</ul>
    </div>
  );
}
