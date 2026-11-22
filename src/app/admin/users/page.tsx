import { createClient } from "@/lib/supabase/server";
import { adminSetUserStatus } from "@/actions/admin";
export const metadata = { title: "Admin · Pengguna" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const s = await createClient();
  const { data } = await s.from("profiles").select("id,full_name,email,account_status,created_at").order("created_at", { ascending: false }).limit(100);
  return (<>
    <h1 className="text-2xl font-bold text-brand-dark">Pengguna</h1>
    {sp.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
    <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-cyan/40"><tr><th className="p-3">Nama</th><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
        <tbody>{data?.map((u) => (
          <tr key={u.id} className="border-t border-brand-cyan/40">
            <td className="p-3">{u.full_name ?? "-"}</td><td className="p-3">{u.email}</td><td className="p-3">{u.account_status}</td>
            <td className="p-3">
              <form action={adminSetUserStatus} className="flex gap-2">
                <input type="hidden" name="id" value={u.id} />
                <select name="status" defaultValue={u.account_status} aria-label="Status akun" className="input !min-h-9"><option value="active">active</option><option value="suspended">suspended</option><option value="banned">banned</option></select>
                <button className="btn !min-h-9">Simpan</button>
              </form>
            </td>
          </tr>))}</tbody>
      </table>
    </div>
  </>);
}
