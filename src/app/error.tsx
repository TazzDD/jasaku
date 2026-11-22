"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-brand-dark">Terjadi kesalahan</h1>
      <p className="mt-2 text-ink/70">Silakan coba lagi beberapa saat.</p>
      <button onClick={reset} className="btn mt-6">Coba lagi</button>
    </div>
  );
}
