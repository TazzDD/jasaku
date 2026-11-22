export default function Loading() {
  return (
    <div role="status" aria-label="Memuat layanan" className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-brand-cyan/40" />)}
    </div>
  );
}
