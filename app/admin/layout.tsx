"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import AdminNav from "@/components/features/admin/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/announcements");
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#FFF8F0" }}
      >
        <span className="text-4xl animate-spin inline-block">🌸</span>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div style={{ background: "#FFF8F0" }} className="min-h-screen">
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-[#2D2D2D]/10"
        style={{ background: "#FFF8F0" }}
      >
        <span className="font-semibold text-sm" style={{ color: "#2D2D2D" }}>
          ⚙️ Admin — Lolapabouillet
        </span>
        <Link
          href="/announcements"
          className="text-xs font-semibold rounded-full px-3 py-1.5 transition-colors active:scale-95"
          style={{ background: "#F4A7B9", color: "#2D2D2D" }}
        >
          ← Retour à l&apos;app
        </Link>
      </header>
      <AdminNav />
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
