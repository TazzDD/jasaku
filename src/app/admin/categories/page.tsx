import { createClient } from "@/lib/supabase/server";
import { adminCreateCategory, adminToggleCategory } from "@/actions/admin";
export const metadata = { title: "Admin · Kategori" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const s = await createClient();
  const { data } = await s.from("categories").select("id,name,slug,parent_id,is_active").order("sort_order").order("name");
  const parents = data?.filter((c) => !c.parent_id) ?? [];
  const nameOf = (id: string | null) => parents.find((p) => p.id === id)?.name;
  return (<>
    <h1 className="text-2xl font-bold text-brand-dark">Kategori</h1>
    {sp.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
    <form action={adminCreateCategory} className="mt-4 grid gap-2 rounded-2xl bg-white p-4 sm:grid-cols-4">
      <input name="name" required placeholder="Nama kategori" aria-label="Nama kategori" className="input sm:col-span-2" />
      <select name="parent_id" aria-label="Induk" className="input"><option value="">Kategori utama</option>{parents.map((p) => <option key={p.id} value={p.id}>Sub dari {p.name}</option>)}</select>
      <button className="btn">Tambah</button>
    </form>
    <ul className="mt-4 space-y-2">{data?.map((c) => (
      <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3">
        <span className={c.is_active ? "" : "text-ink/40 line-through"}>{c.parent_id ? `${nameOf(c.parent_id)} › ` : ""}<strong>{c.name}</strong> <span className="text-xs text-ink/50">/{c.slug}</span></span>
        <form action={adminToggleCategory}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="active" value={String(!c.is_active)} />
          <button className="btn btn-outline !min-h-9">{c.is_active ? "Nonaktifkan" : "Aktifkan"}</button></form>
      </li>))}</ul>
  </>);
}
