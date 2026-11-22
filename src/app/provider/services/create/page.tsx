import { requireRole } from "@/lib/auth/session";
import { createService } from "@/actions/provider";
import ServiceForm from "@/components/services/ServiceForm";
export const metadata = { title: "Tambah Layanan" };
export default async function Create({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireRole("provider");
  const { data: cats } = await supabase.from("categories").select("id,name").not("parent_id", "is", null).eq("is_active", true).order("name");
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-dark">Tambah Layanan</h1>
      {sp.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
      <div className="mt-6"><ServiceForm action={createService} cats={cats ?? []} submit="Kirim untuk Ditinjau" /></div>
    </div>
  );
}
