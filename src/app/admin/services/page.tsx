import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { adminService } from "@/actions/admin";
export const metadata = { title: "Admin · Layanan" };
const STATUSES = ["pending_review", "published", "rejected", "archived", "draft"];
function Btn({ id, op, label, danger }: { id: string; op: string; label: string; danger?: boolean }) {
  return <form action={adminService}><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} /><button className={danger ? "btn btn-outline !min-h-9" : "btn !min-h-9"}>{label}</button></form>;
}
export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status ?? "") ? sp.status! : "pending_review";
  const s = await createClient();
  const { data } = await s.from("services").select("id,title,price,is_featured,status,category:categories(name)").eq("status", status).order("created_at", { ascending: false }).limit(50);
  return (<>
    <h1 className="text-2xl font-bold text-brand-dark">Layanan</h1>
    {sp.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
    <div className="mt-3 flex flex-wrap gap-2">{STATUSES.map((x) => <Link key={x} href={`/admin/services?status=${x}`} className={`rounded-full px-3 py-1 text-sm ${x === status ? "bg-brand-teal text-white" : "bg-white"}`}>{x}</Link>)}</div>
    {!data?.length && <p className="mt-6 rounded-2xl bg-white p-8 text-center text-ink/70">Tidak ada layanan.</p>}
    <ul className="mt-4 space-y-3">{data?.map((x: any) => (
      <li key={x.id} className="rounded-2xl bg-white p-4">
        <p className="font-semibold">{x.title} {x.is_featured && <span className="ml-1 rounded bg-brand-accent px-2 py-0.5 text-xs text-white">Unggulan</span>}</p>
        <p className="text-sm text-ink/70">{x.category?.name} · Rp{Number(x.price).toLocaleString("id-ID")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {x.status !== "published" && <Btn id={x.id} op="publish" label="Terbitkan" />}
          {x.status === "pending_review" && <Btn id={x.id} op="reject" label="Tolak" danger />}
          {x.status === "published" && <Btn id={x.id} op={x.is_featured ? "unfeature" : "feature"} label={x.is_featured ? "Hapus unggulan" : "Jadikan unggulan"} />}
          {x.status === "published" && <Btn id={x.id} op="archive" label="Nonaktifkan" danger />}
        </div>
      </li>))}</ul>
  </>);
}
