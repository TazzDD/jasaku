import { requireUser } from "@/lib/auth/session";
import StatusButtons, { NEXT_CUSTOMER } from "@/components/services/StatusButtons";
import { createReview } from "@/actions/engagement";
export const metadata = { title: "Pesanan Saya" };
export default async function Bookings({ searchParams }: { searchParams: Promise<{ error?: string; info?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("bookings")
    .select("id,booking_code,status,total_price,booking_date,rental_start_date,rental_end_date,service:services(title)")
    .eq("customer_id", user.id).order("created_at", { ascending: false }).limit(50);
  const done = (data ?? []).filter((b: any) => b.status === "completed").map((b: any) => b.id);
  const { data: rv } = done.length ? await supabase.from("reviews").select("booking_id").in("booking_id", done) : { data: [] as { booking_id: string }[] };
  const reviewed = new Set((rv ?? []).map((r) => r.booking_id));
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-dark">Pesanan Saya</h1>
      {sp.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
      {sp.info && <p className="mt-3 rounded-xl bg-brand-cyan/50 p-3 text-sm">{sp.info}</p>}
      {!data?.length && <p className="mt-6 rounded-2xl bg-white p-8 text-center text-ink/70">Belum ada pesanan.</p>}
      <ul className="mt-6 space-y-3">
        {data?.map((b: any) => (
          <li key={b.id} className="rounded-2xl border border-brand-cyan bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2"><strong>{b.service?.title}</strong><span className="rounded-full bg-brand-cyan px-2 py-0.5 text-xs font-semibold">{b.status}</span></div>
            <p className="text-sm text-ink/70">#{b.booking_code} · {b.booking_date ?? `${b.rental_start_date} → ${b.rental_end_date}`} · Rp{Number(b.total_price).toLocaleString("id-ID")}</p>
            <div className="mt-3"><StatusButtons id={b.id} status={b.status} map={NEXT_CUSTOMER} back="/dashboard/bookings" /></div>
            {b.status === "completed" && (reviewed.has(b.id) ? <p className="mt-3 text-sm text-ink/70">Sudah diulas ✓</p> : (
              <form action={createReview} className="mt-3 grid gap-2 sm:grid-cols-[120px_1fr_auto]">
                <input type="hidden" name="booking_id" value={b.id} />
                <select name="rating" required defaultValue="5" aria-label="Rating" className="input"><option value="5">5 ★</option><option value="4">4 ★</option><option value="3">3 ★</option><option value="2">2 ★</option><option value="1">1 ★</option></select>
                <input name="comment" maxLength={1000} placeholder="Tulis ulasan (opsional)" aria-label="Ulasan" className="input" />
                <button className="btn">Kirim ulasan</button>
              </form>))}
          </li>))}
      </ul>
    </div>
  );
}
