import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import StatusButtons, { NEXT_PROVIDER } from "@/components/services/StatusButtons";
export const metadata = { title: "Dashboard Provider" };
export default async function Provider({ searchParams }: { searchParams: Promise<{ error?: string; info?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole("provider");
  const [svc, bk] = await Promise.all([
    supabase.from("services").select("id,title,status,price").eq("provider_id", user.id).order("created_at", { ascending: false }),
    supabase.from("bookings").select("id,booking_code,status,total_price,booking_date,rental_start_date,rental_end_date,notes,service:services(title)")
      .eq("provider_id", user.id).order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      {sp.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
      {sp.info && <p className="rounded-xl bg-brand-cyan/50 p-3 text-sm">{sp.info}</p>}
      <section>
        <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-brand-dark">Layanan Saya</h1><span className="flex gap-2"><Link href="/provider/schedule" className="btn btn-outline">Jadwal</Link><Link href="/provider/reviews" className="btn btn-outline">Ulasan</Link><Link href="/provider/services/create" className="btn">+ Tambah</Link></span></div>
        {!svc.data?.length && <p className="mt-4 rounded-2xl bg-white p-6 text-center text-ink/70">Belum ada layanan.</p>}
        <ul className="mt-4 space-y-2">{svc.data?.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-4"><span>{s.title}</span><span className="flex items-center gap-3 text-sm text-ink/70">{s.status} · Rp{Number(s.price).toLocaleString("id-ID")}<Link href={`/provider/services/${s.id}/edit`} className="btn btn-outline !min-h-9">Edit</Link></span></li>))}</ul>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-dark">Pesanan Masuk</h2>
        {!bk.data?.length && <p className="mt-4 rounded-2xl bg-white p-6 text-center text-ink/70">Belum ada pesanan.</p>}
        <ul className="mt-4 space-y-3">{bk.data?.map((b: any) => (
          <li key={b.id} className="rounded-2xl border border-brand-cyan bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2"><strong>{b.service?.title}</strong><span className="rounded-full bg-brand-cyan px-2 py-0.5 text-xs font-semibold">{b.status}</span></div>
            <p className="text-sm text-ink/70">#{b.booking_code} · {b.booking_date ?? `${b.rental_start_date} → ${b.rental_end_date}`} · Rp{Number(b.total_price).toLocaleString("id-ID")}</p>
            {b.notes && <p className="mt-1 text-sm">Catatan: {b.notes}</p>}
            <div className="mt-3"><StatusButtons id={b.id} status={b.status} map={NEXT_PROVIDER} back="/provider" /></div>
          </li>))}</ul>
      </section>
    </div>
  );
}
