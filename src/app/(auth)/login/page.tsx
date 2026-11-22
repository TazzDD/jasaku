import Link from "next/link";
import { login } from "@/actions/auth";
export const metadata = { title: "Masuk" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; info?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-dark">Masuk</h1>
      {sp.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
      {sp.info && <p className="mt-4 rounded-xl bg-brand-cyan/50 p-3 text-sm">{sp.info}</p>}
      <form action={login} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={sp.next ?? "/dashboard"} />
        <label className="block text-sm font-medium">Email<input name="email" type="email" required className="input mt-1" /></label>
        <label className="block text-sm font-medium">Password<input name="password" type="password" required className="input mt-1" /></label>
        <button className="btn w-full">Masuk</button>
      </form>
      <p className="mt-4 text-sm"><Link href="/forgot-password" className="text-brand-teal underline">Lupa password?</Link></p>
      <p className="mt-2 text-sm">Belum punya akun? <Link href="/register" className="text-brand-teal underline">Daftar</Link></p>
    </div>
  );
}
