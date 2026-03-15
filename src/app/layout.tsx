import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Titlr's PolyBot",
  description: "Polymarket Copy-Trading Bot — Paper Trading Dashboard",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/favicon.png", sizes: "180x180" },
  },
};

const navItems = [
  { href: "/", label: "Portfolio" },
  { href: "/trades/", label: "Trade Log" },
  { href: "/analytics/", label: "Analytics" },
  { href: "/advisor/", label: "AI Advisor" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="border-b border-gray-800 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/favicon.png" alt="PolyBot" width={32} height={32} className="rounded" />
              <h1 className="text-lg font-bold text-emerald-400">Titlr&apos;s PolyBot</h1>
            </div>
            <div className="flex gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
