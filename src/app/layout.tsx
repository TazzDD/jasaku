import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
const inter = Inter({ subsets: ["latin"] });
const brand = process.env.NEXT_PUBLIC_BRAND_NAME ?? "JASAKU";
export const metadata: Metadata = {
  title: { default: `${brand} — Marketplace Jasa & Rental`, template: `%s | ${brand}` },
  description: "Temukan berbagai layanan terpercaya mulai dari jasa profesional, transportasi, hingga kebutuhan rental.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id"><body className={`${inter.className} min-h-screen flex flex-col`}>
      <Navbar /><main className="flex-1">{children}</main><Footer />
    </body></html>
  );
}
