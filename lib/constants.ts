import { supabase } from "./supabase";

// Fetched once per app session; concurrent callers share the in-flight promise.
// Supabase uses the stored auth token so this resolves immediately on mount
// without waiting for onAuthStateChange to fire in React state.
let _eventId: string | null = null;
let _eventIdPromise: Promise<string | null> | null = null;

export async function getEventId(): Promise<string | null> {
  if (_eventId) return _eventId;
  if (_eventIdPromise) return _eventIdPromise;
  _eventIdPromise = (async () => {
    const { data } = await supabase
      .from("events")
      .select("id")
      .limit(1)
      .maybeSingle();
    _eventId = data?.id ?? null;
    _eventIdPromise = null;
    return _eventId;
  })();
  return _eventIdPromise;
}
