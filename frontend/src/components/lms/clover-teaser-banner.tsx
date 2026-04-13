"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

/**
 * LMS home banner promoting Clover. Shown as a promotional card for
 * signed-out visitors; swaps to a compact "welcome back" chip once the
 * viewer is authenticated.
 */
export function CloverTeaserBanner() {
  const { user, isLoading } = useSupabaseUser();

  if (isLoading) {
    return <div className="mb-6 h-28 rounded-2xl bg-clover-50/40 animate-pulse" />;
  }

  if (user) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-clover-200 bg-gradient-to-r from-clover-50 to-white px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-clover-800">
          <span className="text-base">🍀</span>
          <span className="font-medium">
            환영합니다, <span className="font-bold">{user.email}</span>
          </span>
          <span className="text-xs text-clover-600">
            · Clover AI 튜터가 준비되어 있어요
          </span>
        </div>
        <Link
          href="/learner"
          className="inline-flex items-center gap-1 rounded-full bg-clover-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-clover-600"
        >
          Learner로 이동
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-clover-200 bg-gradient-to-r from-clover-50 via-white to-emerald-50">
      <div className="flex flex-col items-start gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-clover-400 to-clover-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-clover-600">
              🍀 Powered by Clover AI
            </p>
            <h2 className="mt-0.5 text-base font-bold text-clover-900 sm:text-lg">
              이 LMS는 Clover AI 튜터로 강화되었습니다
            </h2>
            <p className="mt-0.5 text-xs text-gray-600 sm:text-sm">
              학습자 맞춤 추천 · 실시간 Q&A · 강사/운영자 인사이트까지 한 번에
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/signup"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-clover-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-clover-600"
          >
            무료로 체험하기
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-full border border-clover-200 bg-white px-4 text-sm font-semibold text-clover-700 transition-colors hover:bg-clover-50"
          >
            로그인
          </Link>
        </div>
      </div>
    </section>
  );
}
