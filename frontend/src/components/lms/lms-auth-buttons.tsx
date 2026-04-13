"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useEmbeddedMode } from "@/hooks/use-embedded-mode";

/**
 * Top-utility auth controls for the EduMall shell.
 *
 * Mirrors the global /login /signup pages so we don't fork the auth surface:
 * unauthenticated visitors get 로그인 / 회원가입 links with a `?redirect=`
 * pointing back to the current LMS path, authenticated visitors get their
 * email badge + 로그아웃. The component hides itself entirely when the host
 * is rendering inside an iframe (`?embedded=1`), because the parent frame
 * owns the chrome in that case.
 */
export function LmsAuthButtons() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useSupabaseUser();
  const { embedded } = useEmbeddedMode();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (embedded) return null;

  if (isLoading) {
    return (
      <div
        className="h-4 w-28 animate-pulse rounded-full bg-[#e9e9e9]"
        aria-hidden
      />
    );
  }

  if (!user) {
    const redirectParam =
      pathname && pathname !== "/"
        ? `?redirect=${encodeURIComponent(pathname)}`
        : "";
    return (
      <>
        <Link
          href={`/login${redirectParam}`}
          className="transition-colors hover:text-[#454950]"
        >
          로그인
        </Link>
        <Link
          href={`/signup${redirectParam}`}
          className="transition-colors hover:text-[#454950]"
        >
          회원가입
        </Link>
      </>
    );
  }

  const handleLogout = async (): Promise<void> => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
      router.push("/lms");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const emailLabel = user.email ?? "로그인 됨";

  return (
    <>
      <span className="max-w-[180px] truncate text-[#454950]" title={emailLabel}>
        {emailLabel}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="transition-colors hover:text-[#454950] disabled:opacity-50"
      >
        {isLoggingOut ? "로그아웃 중…" : "로그아웃"}
      </button>
    </>
  );
}
