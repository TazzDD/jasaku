import { requireUser } from "@/lib/auth/session";
import ServiceCard, { type ServiceRow } from "@/components/services/ServiceCard";
export const metadata = { title: "Favorit" };
export default async function Page() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("favorites")
    .select("service:services(id,title,slug,price,pricing_unit,location,service_type,status,category:categories(name),service_images(image_url,display_order))")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(60);
  const list = (data ?? []).map((f: any) => f.service).filter((s: any) => s && s.status === "published") as ServiceRow[];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-dark">Layanan Favorit</h1>
      {!list.length && <p className="mt-6 rounded-2xl bg-white p-8 text-center text-ink/70">Belum ada favorit.</p>}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{list.map((s) => <ServiceCard key={s.id} s={s} />)}</div>
    </div>
  );
}
