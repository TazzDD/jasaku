import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { startChat } from "@/actions/chat";
import { toggleFavorite } from "@/actions/engagement";
import ReportBlock from "@/components/ReportBlock";
import Stars from "@/components/Stars";
import BookingForm from "@/components/services/BookingForm";
const Q = "id,title,slug,description,price,pricing_unit,location,service_type,service_method,provider_id,category:categories(name,slug),service_images(image_url,display_order)";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("title,description").eq("slug", slug).eq("status", "published").maybeSingle();
  return data ? { title: data.title, description: data.description?.slice(0, 160), openGraph: { title: data.title } } : {};
}
export default async function ServiceDetail({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; info?: string }> }) {
  const { slug } = await params; const { error, info } = await searchParams;
  const supabase = await createClient();
  const { data: s } = await supabase.from("services").select(Q).eq("slug", slug).eq("status", "published").maybeSingle();
  if (!s) notFound();
  const [{ data: prov }, { data: { user } }] = await Promise.all([
    supabase.from("public_profiles").select("full_name,avatar_url,location").eq("id", s.provider_id).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const { data: rv } = await supabase.from("reviews").select("id,rating,comment,provider_reply,created_at,customer_id").eq("service_id", s.id).order("created_at", { ascending: false }).limit(100);
  const reviewerIds = [...new Set((rv ?? []).slice(0, 10).map((r) => r.customer_id))];
  const { data: names } = reviewerIds.length ? await supabase.from("public_profiles").select("id,full_name").in("id", reviewerIds) : { data: [] as { id: string; full_name: string | null }[] };
  const avg = rv?.length ? rv.reduce((a, r) => a + r.rating, 0) / rv.length : 0;
  const { data: fav } = user ? await supabase.from("favorites").select("id").eq("user_id", user.id).eq("service_id", s.id).maybeSingle() : { data: null };
  const imgs = [...(s.service_images ?? [])].sort((x: any, y: any) => x.display_order - y.display_order);
  const cat = s.category as unknown as { name: string } | null;
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_380px]">
      <article>
        <div className="grid grid-cols-2 gap-2">
          {imgs.length ? imgs.slice(0, 4).map((i: any) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i.image_url} src={i.image_url} alt={s.title} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
          )) : <div className="col-span-2 aspect-[16/7] rounded-xl bg-brand-cyan/40" />}
        </div>
        <p className="mt-6 text-sm text-ink/70">{cat?.name} · {s.service_type === "rental" ? "Rental" : "Jasa"} · {s.service_method}{s.location ? ` · ${s.location}` : ""}</p>
        <h1 className="mt-1 text-3xl font-bold text-brand-dark">{s.title}</h1>
        {rv?.length ? <p className="mt-1 text-sm"><Stars value={avg} /> {avg.toFixed(1)} ({rv.length} ulasan)</p> : <p className="mt-1 text-sm text-ink/60">Belum ada ulasan</p>}
        <p className="mt-2 text-2xl font-bold">Rp{Number(s.price).toLocaleString("id-ID")} <span className="text-base font-normal">{s.pricing_unit.replace("per_", "/ ").replace("fixed_price", "harga tetap")}</span></p>
        <p className="mt-6 whitespace-pre-line leading-relaxed">{s.description}</p>
        <div className="mt-8 rounded-2xl bg-white p-4"><p className="text-sm text-ink/70">Penyedia</p><p className="font-semibold text-brand-dark">{prov?.full_name ?? "Provider"}</p></div>
      <section aria-labelledby="ulasan" className="mt-8">
          <h2 id="ulasan" className="text-xl font-bold text-brand-dark">Ulasan</h2>
          <ul className="mt-3 space-y-3">{rv?.slice(0, 10).map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4"><div className="flex justify-between text-sm"><strong>{names?.find((n) => n.id === r.customer_id)?.full_name ?? "Pengguna"}</strong><span className="text-ink/50">{new Date(r.created_at).toLocaleDateString("id-ID")}</span></div>
              <Stars value={r.rating} />{r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
              {r.provider_reply && <p className="mt-2 rounded-lg bg-brand-cyan/40 p-2 text-sm"><strong>Balasan penyedia:</strong> {r.provider_reply}</p>}</li>))}</ul>
        </section>
      </article>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        {info && <p className="mb-3 rounded-xl bg-brand-cyan/50 p-3 text-sm">{info}</p>}
        {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {user ? <BookingForm id={s.id} slug={s.slug} type={s.service_type} unit={s.pricing_unit} price={Number(s.price)} />
          : <div className="rounded-2xl bg-white p-5"><p className="mb-3 text-sm">Masuk untuk memesan layanan ini.</p><Link href={`/login?next=/services/${s.slug}`} className="btn w-full">Masuk</Link></div>}
      {user && (
          <form action={toggleFavorite} className="mt-3"><input type="hidden" name="service_id" value={s.id} /><input type="hidden" name="slug" value={s.slug} />
            <button className="btn btn-outline w-full">{fav ? "♥ Hapus dari favorit" : "♡ Simpan ke favorit"}</button></form>)}
        {user && user.id !== s.provider_id && (
          <form action={startChat} className="mt-3"><input type="hidden" name="other_id" value={s.provider_id} /><input type="hidden" name="slug" value={s.slug} />
            <button className="btn btn-outline w-full">Chat dengan penyedia</button></form>)}
      {user && user.id !== s.provider_id && <ReportBlock userId={s.provider_id} serviceId={s.id} back={`/services/${s.slug}`} />}
      </aside>
    </div>
  );
}
