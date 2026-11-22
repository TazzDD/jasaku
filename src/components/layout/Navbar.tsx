import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/actions/auth";
export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const unread = user ? (await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false)).count ?? 0 : 0;
  const brand = process.env.NEXT_PUBLIC_BRAND_NAME ?? "JASAKU";
  const links = (<>
    <Link href="/services" className="hover:text-brand-cyan">Jelajahi Jasa</Link>
    <Link href="/#kategori" className="hover:text-brand-cyan">Kategori</Link>
    <Link href="/#cara-kerja" className="hover:text-brand-cyan">Cara Kerja</Link>
    {user ? (<>
      <Link href="/dashboard/notifications" className="hover:text-brand-cyan">Notifikasi{unread > 0 && <span className="ml-1 rounded-full bg-brand-accent px-1.5 text-xs">{unread}</span>}</Link>
      <Link href="/dashboard" className="hover:text-brand-cyan">Dashboard</Link>
      <form action={logout}><button className="rounded-lg border border-white/40 px-3 py-2 hover:bg-white/10">Keluar</button></form>
    </>) : (<>
      <Link href="/login" className="hover:text-brand-cyan">Masuk</Link>
      <Link href="/register" className="btn !min-h-10">Daftar</Link>
    </>)}
  </>);
  return (
    <header className="sticky top-0 z-40 bg-brand-dark text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3" aria-label="Navigasi utama">
        <Link href="/" className="text-xl font-extrabold tracking-tight">{brand}</Link>
        <div className="hidden items-center gap-5 text-sm md:flex">{links}</div>
        <details className="relative md:hidden">
          <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-white/40" aria-label="Buka menu">☰{unread > 0 && <span className="ml-1 text-xs text-brand-cyan">•</span>}</summary>
          <div className="absolute right-0 mt-2 flex w-64 flex-col gap-4 rounded-2xl bg-brand-secondary p-4 text-sm shadow-lg">{links}</div>
        </details>
      </nav>
    </header>
  );
}
