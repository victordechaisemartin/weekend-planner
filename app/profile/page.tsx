"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import ProfileForm from "@/components/features/profile/ProfileForm";

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <span className="animate-pulse text-4xl">🌸</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream pb-10">
      <ProfileForm user={user} profile={profile} />
    </div>
  );
}
