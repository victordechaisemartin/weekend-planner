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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lolapabouillet 🌸",
  description: "Le plus grand festival du monde 🌸",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-192.png",
    apple: "/logo-192.png",
  },
  appleWebApp: {
    statusBarStyle: "default",
    title: "Lolapabouillet 🌸",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lilitaOne.variable}>
      <body
        className={`${geistSans.variable} antialiased bg-cream text-charcoal`}
      >
        <main className="max-w-lg mx-auto min-h-screen pb-16">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
