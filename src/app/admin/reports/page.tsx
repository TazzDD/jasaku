import { createClient } from "@/lib/supabase/server";
import { adminReport } from "@/actions/admin";
export const metadata = { title: "Admin · Laporan" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const s = await createClient();
  const { data } = await s.from("reports").select("id,reason,description,status,admin_note,created_at").order("created_at", { ascending: false }).limit(50);
  return (<>
    <h1 className="text-2xl font-bold text-brand-dark">Laporan</h1>
    {sp.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
    {!data?.length && <p className="mt-6 rounded-2xl bg-white p-8 text-center text-ink/70">Belum ada laporan.</p>}
    <ul className="mt-4 space-y-3">{data?.map((r) => (
      <li key={r.id} className="rounded-2xl bg-white p-4">
        <div className="flex justify-between gap-2"><strong>{r.reason}</strong><span className="rounded-full bg-brand-cyan px-2 py-0.5 text-xs">{r.status}</span></div>
        {r.description && <p className="mt-1 text-sm">{r.description}</p>}
        <form action={adminReport} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input type="hidden" name="id" value={r.id} />
          <input name="admin_note" defaultValue={r.admin_note ?? ""} placeholder="Catatan admin" aria-label="Catatan admin" className="input" />
          <select name="status" defaultValue={r.status === "open" ? "reviewing" : r.status} aria-label="Status" className="input"><option value="reviewing">reviewing</option><option value="resolved">resolved</option><option value="dismissed">dismissed</option></select>
          <button className="btn">Simpan</button>
        </form>
      </li>))}</ul>
  </>);
}
