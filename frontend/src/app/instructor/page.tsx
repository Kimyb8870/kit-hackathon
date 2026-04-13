"use client";

import { useEffect, useState } from "react";
import { ModeSwitcher } from "@/components/shared/mode-switcher";
import { StruggleList } from "@/components/instructor/struggle-list";
import { ContentGapCard } from "@/components/instructor/content-gap-card";
import { QASummary } from "@/components/instructor/qa-summary";
import {
  ProgressIndicator,
  type ProgressStep,
} from "@/components/shared/progress-indicator";
import { getInstructorDashboard } from "@/lib/api-client";
import type { DashboardSource } from "@/lib/api-client";
import type { InstructorDashboard } from "@/types/instructor";
import { Leaf } from "lucide-react";
import { useEmbeddedMode } from "@/hooks/use-embedded-mode";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useSteppedProgress } from "@/hooks/use-stepped-progress";
import { EmbeddedLoginGate } from "@/components/shared/embedded-login-gate";
import { InstructorChatContainer } from "@/components/chat/instructor-chat-container";
import Link from "next/link";
import { Store, ArrowRight } from "lucide-react";
import {
  useLmsContextStore,
  type LmsInstructorContext,
} from "@/stores/lms-context-store";

const INSTRUCTOR_ID = "instructor-1";

// Extract the LMS context payload from a postMessage event, validating just
// enough structure to avoid trusting arbitrary cross-origin data.
function parseLmsInstructorContext(raw: unknown): LmsInstructorContext | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.instructor_id !== "string") return null;
  if (!Array.isArray(r.course_ids)) return null;
  if (typeof r.time_window_days !== "number") return null;
  return {
    instructor_id: r.instructor_id,
    course_ids: r.course_ids.filter(
      (x): x is string => typeof x === "string"
    ),
    time_window_days: r.time_window_days,
  };
}

const INSTRUCTOR_LOADING_STEPS: ReadonlyArray<ProgressStep> = [
  {
    icon: "🤖",
    label: "Instructor Agent 호출 중...",
    description: "강사 지원 에이전트를 활성화하고 있습니다",
  },
  {
    icon: "📊",
    label: "수강생 학습 데이터 조회 중...",
    description: "최근 168시간 동안의 학습 활동을 가져옵니다",
  },
  {
    icon: "🔍",
    label: "취약 개념 분석 중...",
    description: "학생들이 어려움을 겪는 개념을 식별합니다",
  },
  {
    icon: "📝",
    label: "Q&A 패턴 집계 중...",
    description: "자주 묻는 질문과 콘텐츠 갭을 파악합니다",
  },
  {
    icon: "✅",
    label: "인사이트 생성 완료",
    description: "대시보드를 렌더링합니다",
  },
];

export default function InstructorPage() {
  const [data, setData] = useState<InstructorDashboard | null>(null);
  const [source, setSource] = useState<DashboardSource>("live");
  const [isLoading, setIsLoading] = useState(true);
  const { embedded } = useEmbeddedMode();
  const { user, isLoading: authLoading } = useSupabaseUser();
  const currentStep = useSteppedProgress({
    loading: isLoading,
    totalSteps: INSTRUCTOR_LOADING_STEPS.length,
  });

  useEffect(() => {
    let cancelled = false;
    void getInstructorDashboard(INSTRUCTOR_ID)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setSource(res.source);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData({ struggles: [], contentGaps: [], qaSummary: [] });
        setSource("live");
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for LMS context handoff from the parent window. Only accept
  // messages with the expected envelope so a rogue page can't poison the
  // chat payload. We intentionally do not restrict origin here because the
  // LMS host and the iframe share the same Railway domain in production.
  useEffect(() => {
    const handler = (event: MessageEvent): void => {
      const data = event.data as
        | { type?: string; role?: string; payload?: unknown }
        | null;
      if (!data || data.type !== "clover:lms_context") return;
      if (data.role !== "instructor") return;
      const ctx = parseLmsInstructorContext(data.payload);
      if (!ctx) return;
      useLmsContextStore.getState().setInstructor(ctx);
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
        <EmbeddedLoginGate agentLabel="Instructor Agent" agentEmoji="🍃" />
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
            백엔드 인사이트 API에 연결할 수 없어 데모 데이터를 표시 중입니다.
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
            /api/v1/instructor/insights 엔드포인트에서 직접 가져온 데이터입니다.
          </span>
        </div>
      )}

      {!embedded && (
        <>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-clover-600">
                <span>🍃</span> Instructor Agent
              </div>
              <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-clover-900">
                <Leaf className="h-7 w-7 text-clover-600" />
                강사 지원 대시보드
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                학습자 데이터를 기반으로 강의 개선 포인트와 답변 초안을
                제공합니다.
              </p>
            </div>
            <ModeSwitcher compact />
          </header>
          <Link
            href="/lms/instructor-center?demo=1"
            className="group flex items-center justify-between rounded-xl border border-clover-200 bg-gradient-to-r from-clover-50 via-white to-emerald-50 px-4 py-2.5 transition-colors hover:border-clover-400"
          >
            <div className="flex items-center gap-2 text-xs">
              <Store className="h-4 w-4 text-clover-600" />
              <span className="font-semibold text-clover-800">
                EduMall 강사센터에서 iframe 임베드 뷰로 보기
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
          <Leaf className="h-4 w-4 text-clover-600" />
          <span className="text-xs font-semibold text-clover-800">
            🍃 강사 AI 어시스턴트
          </span>
        </div>
        <div className="h-[460px]">
          <InstructorChatContainer />
        </div>
      </div>

      {isLoading || !data ? (
        <ProgressIndicator
          steps={INSTRUCTOR_LOADING_STEPS}
          currentStep={currentStep}
          compact={embedded}
          title="강사 인사이트를 준비하고 있습니다"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <StruggleList learners={data.struggles} />
          <ContentGapCard gaps={data.contentGaps} />
          <div className="lg:col-span-2">
            <QASummary items={data.qaSummary} />
          </div>
        </div>
      )}
    </div>
  );
}
