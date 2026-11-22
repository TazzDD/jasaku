import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ServiceCard, { type ServiceRow } from "@/components/services/ServiceCard";
const SELECT = "id,title,slug,price,pricing_unit,location,service_type,category:categories(name),service_images(image_url,display_order)";
export default async function Home() {
  const supabase = await createClient();
  const [cats, latest] = await Promise.all([
    supabase.from("categories").select("id,name,slug").is("parent_id", null).eq("is_active", true).order("sort_order"),
    supabase.from("services").select(SELECT).eq("status", "published").order("created_at", { ascending: false }).limit(8),
  ]);
  return (<>
    <section className="bg-brand-secondary text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <h1 className="max-w-2xl text-4xl font-extrabold md:text-5xl">Semua Kebutuhan Jasa, Ada di Satu Tempat.</h1>
        <p className="mt-4 max-w-xl text-brand-cyan">Temukan berbagai layanan terpercaya mulai dari jasa profesional, transportasi, hingga kebutuhan rental dengan mudah.</p>
        <form action="/services" className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
          <input name="q" placeholder="Cari jasa atau rental…" aria-label="Kata kunci" className="input text-ink" />
          <button className="btn">Cari</button>
        </form>
        <Link href="/register" className="btn btn-outline mt-4 !border-white !text-white">Tawarkan Jasa</Link>
      </div>
    </section>
    <section id="kategori" className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-bold text-brand-dark">Kategori Populer</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {cats.data?.map((c) => (
          <Link key={c.id} href={`/services?category=${c.slug}`} className="rounded-2xl border border-brand-cyan bg-white p-5 text-center font-semibold text-brand-dark hover:bg-brand-cyan/40">{c.name}</Link>
        ))}
      </div>
      {cats.error && <p className="mt-4 text-sm text-red-700">Gagal memuat kategori. Periksa konfigurasi Supabase.</p>}
    </section>
    <section className="mx-auto max-w-7xl px-4 pb-12">
      <h2 className="text-2xl font-bold text-brand-dark">Layanan Terbaru</h2>
      {latest.data?.length ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(latest.data as unknown as ServiceRow[]).map((s) => <ServiceCard key={s.id} s={s} />)}
        </div>
      ) : <p className="mt-6 rounded-2xl bg-white p-8 text-center text-ink/70">Belum ada layanan yang dipublikasikan.</p>}
    </section>
    <section id="cara-kerja" className="bg-brand-cyan/40">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:grid-cols-5">
        {["Cari layanan", "Pilih penyedia", "Buat pemesanan", "Tunggu konfirmasi", "Gunakan layanan"].map((t, i) => (
          <div key={t} className="rounded-2xl bg-white p-4"><span className="font-bold text-brand-accent">{i + 1}</span><p className="font-semibold text-brand-dark">{t}</p></div>
        ))}
      </div>
    </section>
  </>);
}
