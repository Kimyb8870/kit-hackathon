"use client";

import { Sparkles, ExternalLink } from "lucide-react";

interface EmbeddedLoginGateProps {
  readonly agentLabel: string;
  readonly agentEmoji: string;
}

/**
 * Rendered inside the LMS iframe when the viewer isn't authenticated.
 * Explains the situation and provides a `target="_top"` button that breaks
 * out of the iframe so the user can log in on the parent page.
 *
 * The link preserves the current iframe URL (minus the `embedded=1` flag)
 * as the `redirect` target so that, after login, the parent navigates the
 * user back into the agent they were trying to reach.
 */
export function EmbeddedLoginGate({
  agentLabel,
  agentEmoji,
}: EmbeddedLoginGateProps) {
  // Build an origin-scoped login URL. We keep the path that the iframe was
  // trying to render (without its query string) as the post-login target.
  const buildLoginHref = () => {
    if (typeof window === "undefined") return "/login";
    const pathname = window.location.pathname;
    const params = new URLSearchParams({ redirect: pathname });
    return `/login?${params.toString()}`;
  };

  return (
    <div className="flex h-full min-h-[320px] w-full flex-1 items-center justify-center bg-gradient-to-b from-clover-50/50 via-white to-white p-6">
      <div className="w-full max-w-sm rounded-2xl border border-clover-100 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-clover-400 to-clover-600 text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-clover-900">
          {agentEmoji} {agentLabel}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Clover AI 튜터를 사용하려면 로그인이 필요합니다.
        </p>
        <a
          href={buildLoginHref()}
          target="_top"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-clover-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-clover-600"
        >
          로그인 / 가입하기
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <p className="mt-3 text-[11px] text-gray-400">
          로그인 페이지가 새 탭에서 열립니다.
        </p>
      </div>
    </div>
  );
}
