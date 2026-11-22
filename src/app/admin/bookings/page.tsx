import { createClient } from "@/lib/supabase/server";
import { adminCancelBooking } from "@/actions/admin";
export const metadata = { title: "Admin · Booking" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const s = await createClient();
  const { data } = await s.from("bookings").select("id,booking_code,status,total_price,created_at,service:services(title)").order("created_at", { ascending: false }).limit(100);
  const open = ["pending", "accepted", "confirmed", "in_progress"];
  return (<>
    <h1 className="text-2xl font-bold text-brand-dark">Booking</h1>
    {sp.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
    <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
      <table className="w-full text-left text-sm"><thead className="bg-brand-cyan/40"><tr><th className="p-3">Kode</th><th className="p-3">Layanan</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
        <tbody>{data?.map((b: any) => (
          <tr key={b.id} className="border-t border-brand-cyan/40"><td className="p-3">{b.booking_code}</td><td className="p-3">{b.service?.title}</td><td className="p-3">Rp{Number(b.total_price).toLocaleString("id-ID")}</td><td className="p-3">{b.status}</td>
            <td className="p-3">{open.includes(b.status) && <form action={adminCancelBooking}><input type="hidden" name="id" value={b.id} /><button className="btn btn-outline !min-h-9">Batalkan</button></form>}</td></tr>))}</tbody></table>
    </div>
  </>);
}
