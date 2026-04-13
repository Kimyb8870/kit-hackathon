"use client";

import { useEffect, useState } from "react";
import { ModeSwitcher } from "@/components/shared/mode-switcher";
import { DemandChart } from "@/components/platform/demand-chart";
import { TrendCard } from "@/components/platform/trend-card";
import { PromotionSuggestion } from "@/components/platform/promotion-suggestion";
import {
  ProgressIndicator,
  type ProgressStep,
} from "@/components/shared/progress-indicator";
import { getPlatformDashboard } from "@/lib/api-client";
import type { DashboardSource } from "@/lib/api-client";
import type { PlatformDashboard } from "@/types/platform";
import { TreePine } from "lucide-react";
import { useEmbeddedMode } from "@/hooks/use-embedded-mode";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useSteppedProgress } from "@/hooks/use-stepped-progress";
import { EmbeddedLoginGate } from "@/components/shared/embedded-login-gate";
import { PlatformChatContainer } from "@/components/chat/platform-chat-container";
import Link from "next/link";
import { Store, ArrowRight } from "lucide-react";
import {
  useLmsContextStore,
  type LmsPlatformContext,
} from "@/stores/lms-context-store";

// Validate the postMessage envelope before storing it. Same defensive
// shape-check as the instructor-side parser.
function parseLmsPlatformContext(raw: unknown): LmsPlatformContext | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.operator_role !== "string") return null;
  if (!Array.isArray(r.focus_categories)) return null;
  if (typeof r.time_window_days !== "number") return null;
  return {
    operator_role: r.operator_role,
    focus_categories: r.focus_categories.filter(
      (x): x is string => typeof x === "string"
    ),
    time_window_days: r.time_window_days,
  };
}

const PLATFORM_LOADING_STEPS: ReadonlyArray<ProgressStep> = [
  {
    icon: "🤖",
    label: "Platform Agent 호출 중...",
    description: "비즈니스 인사이트 에이전트를 활성화합니다",
  },
  {
    icon: "📈",
    label: "강의 수요 데이터 집계 중...",
    description: "카테고리별 학습 활동을 분석합니다",
  },
  {
    icon: "🔥",
    label: "트렌드 탐지 중...",
    description: "최근 검색어와 학습 패턴을 분석합니다",
  },
  {
    icon: "💡",
    label: "프로모션 추천 생성 중...",
    description: "AI가 비즈니스 기회를 발굴하고 있습니다",
  },
  {
    icon: "✅",
    label: "비즈니스 인사이트 준비 완료",
    description: "대시보드를 렌더링합니다",
  },
];

export default function PlatformPage() {
  const [data, setData] = useState<PlatformDashboard | null>(null);
  const [source, setSource] = useState<DashboardSource>("live");
  const [isLoading, setIsLoading] = useState(true);
  const { embedded } = useEmbeddedMode();
  const { user, isLoading: authLoading } = useSupabaseUser();
  const currentStep = useSteppedProgress({
    loading: isLoading,
    totalSteps: PLATFORM_LOADING_STEPS.length,
  });

  useEffect(() => {
    let cancelled = false;
    void getPlatformDashboard()
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setSource(res.source);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData({ demand: [], trends: [], promotions: [] });
        setSource("live");
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // LMS → platform postMessage handoff. The operator-center page sends its
  // operator_role + focus_categories so the platform agent can pre-fill
  // category filters in its tool invocations.
  useEffect(() => {
    const handler = (event: MessageEvent): void => {
      const data = event.data as
        | { type?: string; role?: string; payload?: unknown }
        | null;
      if (!data || data.type !== "clover:lms_context") return;
      if (data.role !== "platform") return;
      const ctx = parseLmsPlatformContext(data.payload);
      if (!ctx) return;
      useLmsContextStore.getState().setPlatform(ctx);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  if (embedded) {
    if (authLoading) {
      return <div className="w-full bg-white px-4 py-4" />;
    }
    if (!user) {
      return (
        <EmbeddedLoginGate agentLabel="Platform Agent" agentEmoji="🌿" />
      );
    }
  }

  return (
    <div
      className={
        embedded
          ? "w-full space-y-4 bg-white px-4 py-4"
          : "mx-auto w-full max-w-6xl space-y-6 px-4 py-8"
      }
    >
      {source === "mock" ? (
        <div
          className={
            embedded
              ? "rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-900 mb-2"
              : "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 mb-6"
          }
        >
          <span
            className={embedded ? "text-xs font-semibold" : "font-semibold"}
          >
            🧪 데모 데이터
          </span>
          <span className={embedded ? "ml-2 text-xs" : "ml-2 text-sm"}>
            플랫폼 인사이트 API에 연결할 수 없어 데모 데이터를 표시 중입니다.
          </span>
        </div>
      ) : (
        <div
          className={
            embedded
              ? "rounded-md border border-clover-200 bg-clover-50 px-2 py-1 text-clover-900 mb-2"
              : "rounded-lg border border-clover-200 bg-clover-50 px-4 py-3 text-clover-900 mb-6"
          }
        >
          <span
            className={embedded ? "text-xs font-semibold" : "font-semibold"}
          >
            ✅ 실시간 인사이트
          </span>
          <span className={embedded ? "ml-2 text-xs" : "ml-2 text-sm"}>
            /api/v1/platform/recommendations + /demand 결과를 직접 표시합니다.
          </span>
        </div>
      )}

      {!embedded && (
        <>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-clover-600">
                <span>🌿</span> Platform Agent
              </div>
              <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-clover-900">
                <TreePine className="h-7 w-7 text-clover-600" />
                비즈니스 인사이트 대시보드
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                수요 예측, 시장 트렌드, 프로모션 제안까지 — 운영자를 위한
                의사결정 허브입니다.
              </p>
            </div>
            <ModeSwitcher compact />
          </header>
          <Link
            href="/lms/operator-center?demo=1"
            className="group flex items-center justify-between rounded-xl border border-clover-200 bg-gradient-to-r from-clover-50 via-white to-emerald-50 px-4 py-2.5 transition-colors hover:border-clover-400"
          >
            <div className="flex items-center gap-2 text-xs">
              <Store className="h-4 w-4 text-clover-600" />
              <span className="font-semibold text-clover-800">
                EduMall 운영자센터에서 iframe 임베드 뷰로 보기
              </span>
              <span className="hidden text-gray-500 sm:inline">
                · Cross-Agent Activity 피드까지 함께 확인
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-clover-600 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </>
      )}

      <div className="rounded-lg border border-clover-200 bg-white">
        <div className="flex items-center gap-2 border-b border-clover-100 bg-clover-50/50 px-4 py-2">
          <TreePine className="h-4 w-4 text-clover-600" />
          <span className="text-xs font-semibold text-clover-800">
            🌿 플랫폼 AI 어시스턴트
          </span>
        </div>
        <div className="h-[460px]">
          <PlatformChatContainer />
        </div>
      </div>

      {isLoading || !data ? (
        <ProgressIndicator
          steps={PLATFORM_LOADING_STEPS}
          currentStep={currentStep}
          compact={embedded}
          title="비즈니스 인사이트를 준비하고 있습니다"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <DemandChart data={data.demand} />
          </div>
          <TrendCard trends={data.trends} />
          <PromotionSuggestion suggestions={data.promotions} />
        </div>
      )}
    </div>
  );
}
