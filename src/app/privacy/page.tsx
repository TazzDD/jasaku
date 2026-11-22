export const metadata = { title: "Kebijakan Privasi" };
export default function Page() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-10 leading-relaxed">
      <h1 className="text-3xl font-bold text-brand-dark">Kebijakan Privasi</h1>
      <p>Kami menyimpan data akun (nama, email, nomor telepon opsional), data layanan, pesanan, pesan, dan ulasan untuk menjalankan platform.</p>
      <p>Email, telepon, dan tanggal lahir tidak ditampilkan secara publik. Alamat pribadi tidak ditampilkan terbuka. Pesan hanya dapat dibaca oleh peserta percakapan dan, jika ada laporan, oleh administrator untuk moderasi.</p>
      <p>Data disimpan di Supabase. Kami tidak menjual data pengguna. Hubungi administrator untuk permintaan penghapusan akun.</p>
    </article>
  );
}
