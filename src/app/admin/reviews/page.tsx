import { createClient } from "@/lib/supabase/server";
import { adminDeleteReview } from "@/actions/admin";
import Stars from "@/components/Stars";
export const metadata = { title: "Admin · Review" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const s = await createClient();
  const { data } = await s.from("reviews").select("id,rating,comment,provider_reply,created_at,service:services(title)").order("created_at", { ascending: false }).limit(100);
  return (<>
    <h1 className="text-2xl font-bold text-brand-dark">Review</h1>
    {sp.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
    {!data?.length && <p className="mt-6 rounded-2xl bg-white p-8 text-center text-ink/70">Belum ada review.</p>}
    <ul className="mt-4 space-y-3">{data?.map((r: any) => (
      <li key={r.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white p-4">
        <div><p className="text-sm text-ink/70">{r.service?.title}</p><Stars value={r.rating} />{r.comment && <p className="mt-1 text-sm">{r.comment}</p>}</div>
        <form action={adminDeleteReview}><input type="hidden" name="id" value={r.id} /><button className="btn btn-outline !min-h-9">Hapus</button></form>
      </li>))}</ul>
  </>);
}
