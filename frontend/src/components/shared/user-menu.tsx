"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { LogOut, LogIn, UserRound } from "lucide-react";

/**
 * NavHeader right-hand slot. Shows the current user email and a logout
 * button when signed in, or a "로그인" link when signed out. The logout
 * clears the client-side Supabase session and navigates home; the server
 * cookies are cleared on the next proxy pass.
 */
export function UserMenu() {
  const { user, isLoading } = useSupabaseUser();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-full bg-clover-50" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-full border border-clover-200 bg-white px-3 py-1.5 text-xs font-semibold text-clover-700 transition-colors hover:bg-clover-50"
      >
        <LogIn className="h-3.5 w-3.5" />
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 rounded-full bg-clover-50 px-3 py-1.5 text-xs text-clover-800 ring-1 ring-clover-100 transition-colors hover:bg-clover-100"
        title="내 프로필"
      >
        <UserRound className="h-3.5 w-3.5 text-clover-600" />
        <span className="hidden max-w-[160px] truncate font-medium sm:inline">
          {user.email}
        </span>
        <span className="font-medium sm:hidden">내 프로필</span>
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="inline-flex items-center gap-1.5 rounded-full border border-clover-200 bg-white px-3 py-1.5 text-xs font-semibold text-clover-700 transition-colors hover:bg-clover-50 disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" />
        {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
      </button>
    </div>
  );
}
