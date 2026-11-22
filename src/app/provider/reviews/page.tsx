import { requireRole } from "@/lib/auth/session";
import { replyReview } from "@/actions/engagement";
import Stars from "@/components/Stars";
export const metadata = { title: "Ulasan" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; info?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole("provider");
  const { data } = await supabase.from("reviews").select("id,rating,comment,provider_reply,created_at,service:services(title)").eq("provider_id", user.id).order("created_at", { ascending: false }).limit(50);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-dark">Ulasan</h1>
      {sp.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
      {sp.info && <p className="mt-3 rounded-xl bg-brand-cyan/50 p-3 text-sm">{sp.info}</p>}
      {!data?.length && <p className="mt-6 rounded-2xl bg-white p-8 text-center text-ink/70">Belum ada ulasan.</p>}
      <ul className="mt-4 space-y-3">{data?.map((r: any) => (
        <li key={r.id} className="rounded-2xl bg-white p-4">
          <p className="text-sm text-ink/70">{r.service?.title}</p>
          <Stars value={r.rating} />
          {r.comment && <p className="mt-1">{r.comment}</p>}
          {r.provider_reply ? <p className="mt-2 rounded-lg bg-brand-cyan/40 p-2 text-sm"><strong>Balasan Anda:</strong> {r.provider_reply}</p> : (
            <form action={replyReview} className="mt-2 flex gap-2"><input type="hidden" name="id" value={r.id} />
              <input name="reply" required maxLength={1000} placeholder="Balas ulasan" aria-label="Balasan" className="input" /><button className="btn">Balas</button></form>)}
        </li>))}</ul>
    </div>
  );
}
