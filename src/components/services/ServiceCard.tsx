import Link from "next/link";
export type ServiceRow = {
  id: string; title: string; slug: string; price: number; pricing_unit: string; location: string | null;
  service_type: "service" | "rental"; category: { name: string } | null; service_images: { image_url: string; display_order: number }[];
};
const UNIT: Record<string, string> = { per_hour: "/jam", per_session: "/sesi", per_day: "/hari", per_trip: "/perjalanan", per_item: "/item", fixed_price: "" };
export default function ServiceCard({ s }: { s: ServiceRow }) {
  const img = [...s.service_images].sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
  return (
    <Link href={`/services/${s.slug}`} className="group overflow-hidden rounded-2xl border border-brand-cyan/60 bg-white transition hover:shadow-md">
      <div className="aspect-[4/3] bg-brand-cyan/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img} alt={s.title} loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <div className="space-y-1 p-4">
        <span className="rounded-full bg-brand-cyan px-2 py-0.5 text-xs font-semibold text-brand-dark">{s.service_type === "rental" ? "Rental" : "Jasa"}</span>
        <h3 className="line-clamp-2 font-semibold text-brand-dark group-hover:text-brand-teal">{s.title}</h3>
        <p className="text-xs text-ink/70">{s.category?.name}{s.location ? ` · ${s.location}` : ""}</p>
        <p className="text-lg font-bold text-brand-dark">Rp{Number(s.price).toLocaleString("id-ID")}<span className="text-sm font-normal">{UNIT[s.pricing_unit]}</span></p>
      </div>
    </Link>
  );
}
