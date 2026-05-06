import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type UserProfile = {
  id: string;
  name: string;
  phone: string | null;
  dietary: string | null;
  beer_level: number | null;
  wine_level: string | null;
  spirits_level: number | null;
  snoring_warning: boolean;
  is_admin: boolean;
};

export type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
};

const PUBLIC_PATHS = ["/auth"];

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return { ...data, is_admin: data.is_admin ?? false };
}

// Module-level deduplication: multiple useAuth() instances (e.g. page + child component)
// share one in-flight request. Cache is keyed by userId so switching accounts works.
// Cleared on SIGNED_OUT so the next sign-in fetches a fresh profile.
let profileCache: { userId: string; profile: UserProfile } | null = null;
let profilePromise: Promise<UserProfile | null> | null = null;

async function fetchProfileWithRetry(userId: string): Promise<UserProfile | null> {
  if (profileCache?.userId === userId) return profileCache.profile;
  if (profilePromise) return profilePromise;

  profilePromise = (async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const p = await fetchProfile(userId);
      if (p) {
        profileCache = { userId, profile: p };
        profilePromise = null;
        return p;
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, 600));
    }
    profilePromise = null;
    return null;
  })();

  return profilePromise;
}

export function useAuth(): AuthState {
  const router   = useRouter();
  const pathname = usePathname();

  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fires immediately with INITIAL_SESSION on mount,
    // providing the current session without a separate getSession() call.
    // Removing getSession() eliminates the double-fire that caused two
    // concurrent fetchProfileWithRetry calls on every mount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          profileCache = null;
          profilePromise = null;
          setProfile(null);
          setUser(null);
          setSession(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            setProfile(await fetchProfileWithRetry(session.user.id));
          } else {
            setProfile(null);
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && !PUBLIC_PATHS.includes(pathname)) {
      router.replace("/auth");
    }
  }, [loading, user, pathname, router]);

  return { user, profile, session, loading, isAdmin: profile?.is_admin ?? false };
}
