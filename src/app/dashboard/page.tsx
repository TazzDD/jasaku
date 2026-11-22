import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { activateProvider } from "@/actions/provider";
export const metadata = { title: "Dashboard" };
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { count }, { data: role }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("customer_id", user.id),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "provider").maybeSingle(),
  ]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-dark">Halo, {profile?.full_name ?? user.email}</h1>
      {sp.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/bookings" className="rounded-2xl bg-white p-6 hover:shadow"><p className="text-sm text-ink/70">Total pesanan</p><p className="text-3xl font-bold">{count ?? 0}</p></Link>
        <Link href="/dashboard/messages" className="rounded-2xl bg-white p-6 font-semibold text-brand-dark hover:shadow">Pesan →</Link>
        <Link href="/dashboard/favorites" className="rounded-2xl bg-white p-6 font-semibold text-brand-dark hover:shadow">Favorit →</Link>
        {role ? <Link href="/provider" className="rounded-2xl bg-brand-secondary p-6 text-white">Buka dashboard provider →</Link> : (
          <form action={activateProvider} className="rounded-2xl bg-white p-6">
            <p className="font-semibold text-brand-dark">Tawarkan jasa</p>
            <input name="business_name" required minLength={2} placeholder="Nama usaha / profil" aria-label="Nama usaha" className="input mt-2" />
            <button className="btn mt-3">Aktifkan mode provider</button>
          </form>)}
      </div>
    </div>
  );
}
