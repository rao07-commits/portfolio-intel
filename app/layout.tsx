import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Portfolio Intelligence",
  description: "Automated portfolio allocation and market briefing system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900`}
      >
        <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
            <Link href="/" className="text-white font-bold text-lg">Portfolio Intel</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">Overview</Link>
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">Macro</Link>
              <Link href="/allocation" className="text-slate-400 hover:text-white transition-colors">Allocation</Link>
              <Link href="/etfs" className="text-slate-400 hover:text-white transition-colors">ETFs</Link>
              <Link href="/briefing" className="text-slate-400 hover:text-white transition-colors">Briefings</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
