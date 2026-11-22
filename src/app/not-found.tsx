import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-brand-dark">Halaman tidak ditemukan</h1>
      <Link href="/" className="btn mt-6">Ke beranda</Link>
    </div>
  );
}
