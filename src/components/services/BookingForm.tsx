"use client";
import { useState } from "react";
import { createBooking } from "@/actions/bookings";
type Props = { id: string; slug: string; type: "service" | "rental"; unit: string; price: number };
const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
export default function BookingForm({ id, slug, type, unit, price }: Props) {
  const [dur, setDur] = useState(1), [qty, setQty] = useState(1), [a, setA] = useState(""), [b, setB] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  let d = unit === "per_hour" || unit === "per_day" ? dur : 1;
  if (type === "rental" && a && b && b >= a) d = Math.round((+new Date(b) - +new Date(a)) / 86400000) + 1;
  return (
    <form action={createBooking} className="space-y-3 rounded-2xl border border-brand-cyan bg-white p-5">
      <input type="hidden" name="service_id" value={id} /><input type="hidden" name="slug" value={slug} />
      {type === "rental" ? (<>
        <label className="block text-sm">Tanggal mulai<input type="date" name="rental_start" min={today} required value={a} onChange={(e) => setA(e.target.value)} className="input mt-1" /></label>
        <label className="block text-sm">Tanggal kembali<input type="date" name="rental_end" min={a || today} required value={b} onChange={(e) => setB(e.target.value)} className="input mt-1" /></label>
        <label className="block text-sm">Jumlah<input type="number" name="quantity" min={1} value={qty} onChange={(e) => setQty(+e.target.value || 1)} className="input mt-1" /></label>
        <label className="block text-sm">Lokasi pengambilan<input name="pickup" className="input mt-1" /></label>
        <label className="block text-sm">Lokasi pengembalian<input name="ret" className="input mt-1" /></label>
      </>) : (<>
        <label className="block text-sm">Tanggal<input type="date" name="booking_date" min={today} required className="input mt-1" /></label>
        <label className="block text-sm">Waktu mulai<input type="time" name="start_time" className="input mt-1" /></label>
        {(unit === "per_hour" || unit === "per_day") && (
          <label className="block text-sm">Durasi ({unit === "per_hour" ? "jam" : "hari"})<input type="number" name="duration" min={1} value={dur} onChange={(e) => setDur(+e.target.value || 1)} className="input mt-1" /></label>)}
        <label className="block text-sm">Lokasi layanan<input name="pickup" className="input mt-1" /></label>
      </>)}
      <label className="block text-sm">Catatan<textarea name="notes" maxLength={1000} rows={3} className="input mt-1 py-2" /></label>
      <p className="text-sm">Estimasi: <strong className="text-lg text-brand-dark">{rp(price * d * (type === "rental" ? qty : 1))}</strong></p>
      <p className="text-xs text-ink/60">Harga final dihitung ulang server. Pembayaran disepakati langsung dengan provider.</p>
      <button className="btn w-full">Kirim Permintaan</button>
    </form>
  );
}
