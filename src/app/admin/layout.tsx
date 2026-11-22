import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
const NAV = [["/admin", "Ringkasan"], ["/admin/services", "Layanan"], ["/admin/bookings", "Booking"], ["/admin/reviews", "Review"], ["/admin/categories", "Kategori"], ["/admin/users", "Pengguna"], ["/admin/reports", "Laporan"]];
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return (
    <div className="mx-auto max-w-7xl gap-6 px-4 py-6 md:grid md:grid-cols-[200px_1fr]">
      <nav aria-label="Menu admin" className="mb-4 flex gap-2 overflow-x-auto rounded-2xl bg-brand-dark p-3 md:mb-0 md:flex-col">
        {NAV.map(([href, label]) => <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-white hover:bg-brand-secondary">{label}</Link>)}
      </nav>
      <div>{children}</div>
    </div>
  );
}
