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

// Pages that do not require a session
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

// Retries up to 4 times (600 ms apart) to handle the race where onAuthStateChange
// fires before the users-row upsert in handleSignup has completed.
async function fetchProfileWithRetry(userId: string): Promise<UserProfile | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const profile = await fetchProfile(userId);
    if (profile) return profile;
    if (attempt < 3) await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

export function useAuth(): AuthState {
  const router   = useRouter();
  const pathname = usePathname();

  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from the persisted session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) setProfile(await fetchProfileWithRetry(session.user.id));
      setLoading(false);
    });

    // Stay in sync with sign-in / sign-out / token refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setProfile(await fetchProfileWithRetry(session.user.id));
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Redirect unauthenticated users away from protected pages
  useEffect(() => {
    if (!loading && !user && !PUBLIC_PATHS.includes(pathname)) {
      router.replace("/auth");
    }
  }, [loading, user, pathname, router]);

  return { user, profile, session, loading, isAdmin: profile?.is_admin ?? false };
}
