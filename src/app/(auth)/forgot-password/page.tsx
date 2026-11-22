import { forgotPassword } from "@/actions/auth";
export const metadata = { title: "Lupa Password" };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; info?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-dark">Lupa Password</h1>
      {sp.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sp.error}</p>}
      {sp.info && <p className="mt-4 rounded-xl bg-brand-cyan/50 p-3 text-sm">{sp.info}</p>}
      <form action={forgotPassword} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Email<input name="email" type="email" required className="input mt-1" /></label>
        <button className="btn w-full">Kirim tautan reset</button>
      </form>
    </div>
  );
}
