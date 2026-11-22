import { changeStatus } from "@/actions/bookings";
const LABEL: Record<string, string> = { accepted: "Terima", rejected: "Tolak", confirmed: "Konfirmasi", in_progress: "Mulai", completed: "Selesai", cancelled: "Batalkan" };
export const NEXT_PROVIDER: Record<string, string[]> = { pending: ["accepted", "rejected"], accepted: ["confirmed", "cancelled"], confirmed: ["in_progress", "cancelled"], in_progress: ["completed"] };
export const NEXT_CUSTOMER: Record<string, string[]> = { pending: ["cancelled"], accepted: ["cancelled"], confirmed: ["cancelled"] };
export default function StatusButtons({ id, status, map, back }: { id: string; status: string; map: Record<string, string[]>; back: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(map[status] ?? []).map((n) => (
        <form key={n} action={changeStatus}>
          <input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={n} /><input type="hidden" name="back" value={back} />
          <button className={n === "rejected" || n === "cancelled" ? "btn btn-outline !min-h-9" : "btn !min-h-9"}>{LABEL[n]}</button>
        </form>))}
    </div>
  );
}
