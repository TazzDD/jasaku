type Svc = { id: string; title: string; description: string | null; category_id: string; service_type: string; pricing_unit: string; price: number; location: string | null; service_method: string };
export default function ServiceForm({ action, cats, svc, submit }: { action: (fd: FormData) => void | Promise<void>; cats: { id: string; name: string }[]; svc?: Svc; submit: string }) {
  return (
    <form action={action} className="space-y-4">
      {svc && <input type="hidden" name="id" value={svc.id} />}
      <label className="block text-sm font-medium">Judul<input name="title" required defaultValue={svc?.title} className="input mt-1" /></label>
      <label className="block text-sm font-medium">Deskripsi<textarea name="description" required rows={5} defaultValue={svc?.description ?? ""} className="input mt-1 py-2" /></label>
      <label className="block text-sm font-medium">Kategori<select name="category_id" required defaultValue={svc?.category_id ?? ""} className="input mt-1"><option value="">Pilih…</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Jenis<select name="service_type" defaultValue={svc?.service_type} className="input mt-1"><option value="service">Jasa</option><option value="rental">Rental</option></select></label>
        <label className="block text-sm font-medium">Satuan harga<select name="pricing_unit" defaultValue={svc?.pricing_unit} className="input mt-1"><option value="per_hour">Per jam</option><option value="per_session">Per sesi</option><option value="per_day">Per hari</option><option value="per_trip">Per perjalanan</option><option value="per_item">Per item</option><option value="fixed_price">Harga tetap</option></select></label>
        <label className="block text-sm font-medium">Harga (Rp)<input name="price" type="number" min="0" required defaultValue={svc?.price} className="input mt-1" /></label>
        <label className="block text-sm font-medium">Metode<select name="service_method" defaultValue={svc?.service_method} className="input mt-1"><option value="offline">Offline</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></label>
      </div>
      <label className="block text-sm font-medium">Lokasi<input name="location" defaultValue={svc?.location ?? ""} className="input mt-1" /></label>
      <button className="btn">{submit}</button>
    </form>
  );
}
