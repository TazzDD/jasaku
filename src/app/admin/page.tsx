import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "Admin" };
const count = (s: any, t: string, f?: (q: any) => any) => { const q = s.from(t).select("id", { count: "exact", head: true }); return (f ? f(q) : q).then((r: any) => r.count ?? 0); };
export default async function Admin() {
  const s = await createClient();
  const [users, providers, services, pending, bookings, active, done, reports] = await Promise.all([
    count(s, "profiles"), count(s, "provider_profiles"), count(s, "services"),
    count(s, "services", (q) => q.eq("status", "pending_review")),
    count(s, "bookings"), count(s, "bookings", (q) => q.in("status", ["accepted", "confirmed", "in_progress"])),
    count(s, "bookings", (q) => q.eq("status", "completed")), count(s, "reports", (q) => q.eq("status", "open")),
  ]);
  const cards: [string, number][] = [["Pengguna", users], ["Provider", providers], ["Layanan", services], ["Menunggu review", pending], ["Booking", bookings], ["Booking aktif", active], ["Booking selesai", done], ["Laporan terbuka", reports]];
  return (<>
    <h1 className="text-2xl font-bold text-brand-dark">Ringkasan Platform</h1>
    <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(([l, n]) => <div key={l} className="rounded-2xl bg-white p-5"><p className="text-sm text-ink/70">{l}</p><p className="text-3xl font-bold text-brand-dark">{n}</p></div>)}
    </div>
  </>);
}
