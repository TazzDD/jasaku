import Link from "next/link";
import { register } from "@/actions/auth";
export const metadata = { title: "Daftar" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-dark">Daftar</h1>
      {sp.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
      <form action={register} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Nama lengkap<input name="full_name" required className="input mt-1" /></label>
        <label className="block text-sm font-medium">Email<input name="email" type="email" required className="input mt-1" /></label>
        <label className="block text-sm font-medium">Password (min. 8 karakter)<input name="password" type="password" minLength={8} required className="input mt-1" /></label>
        <label className="flex items-start gap-2 text-sm"><input name="adult" type="checkbox" required className="mt-1" />Saya berusia 18 tahun ke atas dan menyetujui syarat layanan.</label>
        <button className="btn w-full">Daftar</button>
      </form>
      <p className="mt-4 text-sm">Sudah punya akun? <Link href="/login" className="text-brand-teal underline">Masuk</Link></p>
    </div>
  );
}
