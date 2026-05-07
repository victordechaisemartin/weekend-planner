import type { Metadata } from "next";
import localFont from "next/font/local";
import { Lilita_One } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const lilitaOne = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lilita",
});

export const metadata: Metadata = {
  title: "Lolapabouillet 🌸",
  description: "Le plus grand festival du monde 🌸",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lilitaOne.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${geistSans.variable} antialiased bg-cream text-charcoal`}
      >
        <main className="max-w-lg mx-auto min-h-screen pb-16">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
