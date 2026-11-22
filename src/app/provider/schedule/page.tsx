import { requireRole } from "@/lib/auth/session";
import { addAvailability, deleteAvailability } from "@/actions/provider";
export const metadata = { title: "Jadwal" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; info?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole("provider");
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: svcs }, { data: slots }] = await Promise.all([
    supabase.from("services").select("id,title").eq("provider_id", user.id).neq("status", "archived").order("title"),
    supabase.from("service_availability").select("id,available_date,start_time,end_time,is_available,service:services(title)").eq("provider_id", user.id).gte("available_date", today).order("available_date").limit(100),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-dark">Jadwal Ketersediaan</h1>
      <p className="text-sm text-ink/70">Jika sebuah tanggal punya jadwal, pelanggan hanya bisa memesan pada jam yang ditandai tersedia. Tanggal tanpa jadwal dianggap terbuka.</p>
      {sp.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
      {sp.info && <p className="rounded-xl bg-brand-cyan/50 p-3 text-sm">{sp.info}</p>}
      <form action={addAvailability} className="grid gap-2 rounded-2xl bg-white p-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">Layanan<select name="service_id" required className="input mt-1">{svcs?.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
        <label className="text-sm">Tanggal<input type="date" name="available_date" min={today} required className="input mt-1" /></label>
        <label className="text-sm">Status<select name="is_available" className="input mt-1"><option value="true">Tersedia</option><option value="false">Tidak tersedia</option></select></label>
        <label className="text-sm">Jam mulai (opsional)<input type="time" name="start_time" className="input mt-1" /></label>
        <label className="text-sm">Jam selesai (opsional)<input type="time" name="end_time" className="input mt-1" /></label>
        <button className="btn sm:col-span-2">Tambah jadwal</button>
      </form>
      {!slots?.length && <p className="rounded-2xl bg-white p-6 text-center text-ink/70">Belum ada jadwal.</p>}
      <ul className="space-y-2">{slots?.map((a: any) => (
        <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-sm">
          <span><strong>{a.service?.title}</strong> · {a.available_date} {a.start_time ? `${a.start_time.slice(0, 5)}–${a.end_time?.slice(0, 5) ?? ""}` : "seharian"} · {a.is_available ? "tersedia" : "tidak tersedia"}</span>
          <form action={deleteAvailability}><input type="hidden" name="id" value={a.id} /><button className="btn btn-outline !min-h-9">Hapus</button></form>
        </li>))}</ul>
    </div>
  );
}
