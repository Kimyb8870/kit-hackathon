"use client";

import { useSupabaseUser } from "@/hooks/use-supabase-user";

/**
 * Mounts `useSupabaseUser` once at the root so the Supabase auth state is
 * mirrored into the profile store. Renders children unchanged; it's
 * side-effect-only.
 */
export function SupabaseAuthProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  useSupabaseUser();
  return <>{children}</>;
}
