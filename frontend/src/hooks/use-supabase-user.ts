"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useProfileStore } from "@/stores/profile-store";

export interface SupabaseUserState {
  readonly user: User | null;
  readonly isLoading: boolean;
}

/**
 * Subscribes to the Supabase auth state and mirrors the user id into the
 * profile store so existing code that reads `useProfileStore(s => s.userId)`
 * keeps working. On sign-out it wipes the persisted profile so the next
 * learner starts with a clean onboarding flow.
 *
 * Use this from a single top-level client component (e.g. a provider in the
 * root layout) to avoid multiple subscriptions.
 */
export function useSupabaseUser(): SupabaseUserState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setUserId = useProfileStore((s) => s.setUserId);
  const resetSession = useProfileStore((s) => s.resetSession);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user);
      setUserId(data.user?.id ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (event === "SIGNED_OUT") {
        resetSession();
      } else {
        setUserId(nextUser?.id ?? null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setUserId, resetSession]);

  return { user, isLoading };
}
