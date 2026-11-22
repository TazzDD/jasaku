import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ServiceCard, { type ServiceRow } from "@/components/services/ServiceCard";
export const metadata = { title: "Jelajahi Jasa" };
const PAGE = 12;
type SP = { q?: string; category?: string; type?: string; min?: string; max?: string; sort?: string; page?: string };
export default async function Services({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const supabase = await createClient();
  let q = supabase.from("services")
    .select("id,title,slug,price,pricing_unit,location,service_type,category:categories!inner(name,slug),service_images(image_url,display_order)", { count: "exact" })
    .eq("status", "published");
  const term = (sp.q ?? "").replace(/[%,()*]/g, " ").trim().slice(0, 80);
  if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`);
  if (sp.category) q = q.eq("category.slug", sp.category);
  if (sp.type === "service" || sp.type === "rental") q = q.eq("service_type", sp.type);
  if (Number(sp.min) > 0) q = q.gte("price", Number(sp.min));
  if (Number(sp.max) > 0) q = q.lte("price", Number(sp.max));
  q = sp.sort === "price_asc" ? q.order("price") : sp.sort === "price_desc" ? q.order("price", { ascending: false }) : q.order("created_at", { ascending: false });
  const { data, count, error } = await q.range((page - 1) * PAGE, page * PAGE - 1);
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const link = (p: number) => `/services?${new URLSearchParams({ ...(sp as Record<string, string>), page: String(p) })}`;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-brand-dark">Jelajahi Jasa</h1>
      <form className="mt-4 grid gap-2 sm:grid-cols-6">
        <input name="q" defaultValue={sp.q} placeholder="Kata kunci / lokasi" aria-label="Kata kunci" className="input sm:col-span-2" />
        <select name="type" defaultValue={sp.type ?? ""} aria-label="Tipe" className="input"><option value="">Semua tipe</option><option value="service">Jasa</option><option value="rental">Rental</option></select>
        <input name="min" type="number" min="0" defaultValue={sp.min} placeholder="Harga min" aria-label="Harga minimum" className="input" />
        <input name="max" type="number" min="0" defaultValue={sp.max} placeholder="Harga max" aria-label="Harga maksimum" className="input" />
        <select name="sort" defaultValue={sp.sort ?? ""} aria-label="Urutkan" className="input"><option value="">Terbaru</option><option value="price_asc">Harga terendah</option><option value="price_desc">Harga tertinggi</option></select>
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        <button className="btn sm:col-span-6 sm:justify-self-start">Terapkan</button>
      </form>
      {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">Terjadi kesalahan saat memuat data.</p>}
      {!error && !data?.length && <p className="mt-6 rounded-2xl bg-white p-10 text-center text-ink/70">Tidak ada layanan yang cocok.</p>}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {(data as unknown as ServiceRow[] | null)?.map((s) => <ServiceCard key={s.id} s={s} />)}
      </div>
      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          {page > 1 && <Link className="btn btn-outline" href={link(page - 1)}>Sebelumnya</Link>}
          <span className="text-sm">Halaman {page} / {pages}</span>
          {page < pages && <Link className="btn btn-outline" href={link(page + 1)}>Berikutnya</Link>}
        </div>
      )}
    </div>
  );
}
