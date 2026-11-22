export default function Footer() {
  const brand = process.env.NEXT_PUBLIC_BRAND_NAME ?? "JASAKU";
  return (
    <footer className="bg-brand-dark text-brand-cyan">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm">
        <p className="font-bold text-white">{brand}</p>
        <p className="mt-1">Platform penghubung customer dan penyedia jasa/rental. Pembayaran disepakati langsung antar pihak.</p>
        <p className="mt-3 flex flex-wrap gap-4 underline"><a href="/terms">Syarat Layanan</a><a href="/privacy">Privasi</a><a href="/safety">Keamanan Pertemuan</a></p>
        <p className="mt-4 text-xs">© {new Date().getFullYear()} {brand}</p>
      </div>
    </footer>
  );
}
