import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Weekend Planner",
  description: "Plan your festival weekend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} antialiased bg-cream text-charcoal`}
      >
        {/* Global top banner */}
        <header className="fixed top-0 left-0 right-0 z-50 h-11 bg-white/90 backdrop-blur-md border-b border-pink/20 flex items-center px-4 max-w-lg mx-auto">
          <span className="text-lg leading-none" aria-hidden>🌸</span>
          <span className="flex-1 text-center text-sm font-bold text-charcoal tracking-wide -ml-5">
            Lolapabouillet
          </span>
        </header>

        <main className="max-w-lg mx-auto min-h-screen pt-11 pb-16">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
