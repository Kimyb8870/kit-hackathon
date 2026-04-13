"use client";

import { useEffect, useState } from "react";

/**
 * Returns true after the component has mounted on the client. Use this to
 * gate UI that depends on persisted zustand state — during SSR/prerender
 * the store always shows its in-memory defaults, so we must avoid rendering
 * such UI until after hydration to prevent mismatches.
 */
export function useProfileHydration(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
