import { resetPassword } from "@/actions/auth";
export const metadata = { title: "Reset Password" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-dark">Password Baru</h1>
      {sp.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
      <form action={resetPassword} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Password baru<input name="password" type="password" minLength={8} required className="input mt-1" /></label>
        <label className="block text-sm font-medium">Ulangi password<input name="confirm" type="password" minLength={8} required className="input mt-1" /></label>
        <button className="btn w-full">Simpan</button>
      </form>
    </div>
  );
}
