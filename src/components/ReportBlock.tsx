import { reportContent, blockUser } from "@/actions/safety";
export default function ReportBlock({ userId, serviceId, back }: { userId: string; serviceId?: string; back: string }) {
  return (
    <details className="mt-3 rounded-xl bg-white p-3 text-sm">
      <summary className="cursor-pointer font-medium text-brand-dark">Laporkan / blokir</summary>
      <form action={reportContent} className="mt-3 space-y-2">
        <input type="hidden" name="reported_user_id" value={userId} /><input type="hidden" name="back" value={back} />
        {serviceId && <input type="hidden" name="service_id" value={serviceId} />}
        <select name="reason" required aria-label="Alasan" className="input"><option value="penipuan">Penipuan</option><option value="pelecehan">Pelecehan / ancaman</option><option value="spam">Spam</option><option value="konten_tidak_pantas">Konten tidak pantas</option><option value="lainnya">Lainnya</option></select>
        <textarea name="description" maxLength={1000} rows={2} placeholder="Jelaskan singkat" aria-label="Keterangan" className="input py-2" />
        <button className="btn btn-outline !min-h-9 w-full">Kirim laporan</button>
      </form>
      <form action={blockUser} className="mt-2"><input type="hidden" name="blocked_id" value={userId} /><input type="hidden" name="back" value={back} />
        <button className="btn btn-outline !min-h-9 w-full">Blokir pengguna ini</button></form>
    </details>
  );
}
