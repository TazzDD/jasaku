import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { updateService, archiveService, uploadServiceImage, deleteServiceImage } from "@/actions/provider";
import ServiceForm from "@/components/services/ServiceForm";
import { MAX_IMAGES } from "@/lib/validations/service";
export const metadata = { title: "Edit Layanan" };
export default async function Edit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; info?: string }> }) {
  const { id } = await params; const sp = await searchParams;
  const { supabase, user } = await requireRole("provider");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: svc }, { data: cats }, { data: imgs }] = await Promise.all([
    supabase.from("services").select("id,title,description,category_id,service_type,pricing_unit,price,location,service_method,status").eq("id", id).eq("provider_id", user.id).maybeSingle(),
    supabase.from("categories").select("id,name").not("parent_id", "is", null).eq("is_active", true).order("name"),
    supabase.from("service_images").select("id,image_url").eq("service_id", id).order("display_order"),
  ]);
  if (!svc) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div><h1 className="text-2xl font-bold text-brand-dark">Edit Layanan</h1><p className="text-sm text-ink/70">Status: {svc.status}. Menyimpan perubahan akan mengirim ulang layanan untuk ditinjau admin.</p></div>
      {sp.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
      {sp.info && <p className="rounded-xl bg-brand-cyan/50 p-3 text-sm">{sp.info}</p>}
      <section aria-labelledby="gambar">
        <h2 id="gambar" className="font-semibold text-brand-dark">Gambar ({imgs?.length ?? 0}/{MAX_IMAGES})</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {imgs?.map((i) => (
            <div key={i.id} className="overflow-hidden rounded-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image_url} alt="Gambar layanan" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <form action={deleteServiceImage} className="p-2"><input type="hidden" name="service_id" value={svc.id} /><input type="hidden" name="image_id" value={i.id} /><button className="btn btn-outline !min-h-9 w-full">Hapus</button></form>
            </div>))}
        </div>
        <form action={uploadServiceImage} encType="multipart/form-data" className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={svc.id} />
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required aria-label="Pilih gambar" className="text-sm" />
          <button className="btn !min-h-10">Unggah</button>
        </form>
        <p className="mt-1 text-xs text-ink/60">JPG/PNG/WebP, maksimal 5 MB.</p>
      </section>
      <ServiceForm action={updateService} cats={cats ?? []} svc={svc as any} submit="Simpan Perubahan" />
      {svc.status !== "archived" && (
        <form action={archiveService}><input type="hidden" name="id" value={svc.id} /><button className="btn btn-outline">Arsipkan layanan</button></form>)}
    </div>
  );
}
