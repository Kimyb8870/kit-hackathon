"use client";

import { useEffect, useRef, useState } from "react";
import {
  getInstructorDashboard,
  type DashboardSource,
} from "@/lib/api-client";
import type { InstructorDashboard } from "@/types/instructor";
import Link from "next/link";
import { ActivityFeed } from "@/components/cross-agent/activity-feed";
import { ToolCallSideCard } from "@/components/cross-agent/tool-call-side-card";

// Demo constants — these match the seeded instructor + demo course
// fixture (see supabase/seed). We pin the demo to 440001 (Python 기초)
// because that is the only course currently populated in production
// `course_clips`; the other 6 catalog rows exist for UI browsing but
// their clip scripts are empty, so pointing the Instructor agent at them
// would surface an empty curriculum. Swap to real IDs if the seed changes.
const DEMO_INSTRUCTOR_ID = "demo-instructor";
const DEMO_COURSE_IDS: ReadonlyArray<string> = [
  "550e8400-e29b-41d4-a716-446655440001",
];
const DEMO_TIME_WINDOW_DAYS = 7;

interface StatCardData {
  readonly label: string;
  readonly value: string;
}

function dashboardToStats(
  data: InstructorDashboard | null,
  source: DashboardSource
): ReadonlyArray<StatCardData> {
  if (!data) {
    return [
      { label: "취약 개념", value: "—" },
      { label: "콘텐츠 갭", value: "—" },
      { label: "학습자 Q&A", value: "—" },
      { label: "실패 퀴즈", value: "—" },
    ];
  }
  const failedQuizzes = data.struggles.reduce(
    (acc, s) => acc + s.failedQuizzes,
    0
  );
  return [
    { label: "취약 개념", value: String(data.struggles.length) },
    { label: "콘텐츠 갭", value: String(data.contentGaps.length) },
    { label: "학습자 Q&A", value: String(data.qaSummary.length) },
    {
      label: "실패 퀴즈",
      value: source === "mock" ? "—" : String(failedQuizzes),
    },
  ];
}

export default function InstructorCenterPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dashboard, setDashboard] = useState<InstructorDashboard | null>(null);
  const [source, setSource] = useState<DashboardSource>("live");

  useEffect(() => {
    let cancelled = false;
    void getInstructorDashboard(DEMO_INSTRUCTOR_ID)
      .then((res) => {
        if (cancelled) return;
        setDashboard(res.data);
        setSource(res.source);
      })
      .catch(() => {
        if (cancelled) return;
        setDashboard({ struggles: [], contentGaps: [], qaSummary: [] });
        setSource("live");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // postMessage is delivered to the iframe's contentWindow once it has
  // loaded. We attach onLoad directly instead of scheduling the send from
  // a useEffect so we don't race the iframe's boot.
  const handleIframeLoad = (): void => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      {
        type: "clover:lms_context",
        role: "instructor",
        payload: {
          instructor_id: DEMO_INSTRUCTOR_ID,
          course_ids: DEMO_COURSE_IDS,
          time_window_days: DEMO_TIME_WINDOW_DAYS,
        },
      },
      "*"
    );
  };

  const stats = dashboardToStats(dashboard, source);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8">
      <div className="mb-5 rounded-[10px] border border-clover-200 bg-gradient-to-r from-clover-50 via-white to-emerald-50 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="text-base" aria-hidden>
              🍃
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-clover-700">
                Clover Instructor Agent 활성화
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">
                이 페이지는 EduMall 강사센터에 Clover 강사 에이전트가 그대로
                embed된 뷰입니다. 오른쪽{" "}
                <strong className="font-semibold text-clover-800">
                  Cross-Agent Activity
                </strong>
                에서 학습자 에이전트가 방금 감지한 어려움 이벤트가 실시간으로
                흐릅니다.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 text-[10px]">
            <span className="rounded-full bg-clover-100 px-2 py-1 font-semibold text-clover-700">
              💡 예시 질문 칩 클릭
            </span>
            <span className="rounded-full bg-clover-100 px-2 py-1 font-semibold text-clover-700">
              📡 실시간 토스트
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-clover-100 pt-3 text-[11px]">
          <span className="rounded-full bg-clover-100 px-2 py-1 text-clover-800">
            ① <strong>T+0 학습자</strong>: 어려운 개념 질문 → 복습 제안
          </span>
          <span className="text-clover-600">→</span>
          <span className="rounded-full bg-clover-100 px-2 py-1 text-clover-800">
            ② <strong>T+15s 강사</strong>: struggling 집계 → 보충 클립
          </span>
          <span className="text-clover-600">→</span>
          <span className="rounded-full bg-clover-100 px-2 py-1 text-clover-800">
            ③ <strong>T+30s 운영자</strong>: 수요 분석 → 프로모션
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-clover-100 pt-3 text-[11px]">
          <span className="font-semibold text-clover-700">다음 단계:</span>
          <Link
            href="/lms/operator-center?demo=1"
            className="inline-flex items-center gap-1 rounded-full bg-clover-600 px-3 py-1 font-semibold text-white transition-colors hover:bg-clover-700"
          >
            🌿 운영자센터로 이동 →
          </Link>
          <span className="text-gray-500">
            Platform Agent가 이 강사 리포트를 종합해 프로모션을 제안합니다
          </span>
        </div>
      </div>
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#8a8d92]">
          EduMall 강사센터
        </p>
        <h1 className="mt-1 text-[24px] font-bold text-[#1f1f1f]">
          나의 강의 관리
        </h1>
        <p className="mt-1 text-[12px] text-[#8a8d92]">
          수강생 질문 분석, 커리큘럼 개선 제안, 학습 패턴 인사이트를 한 곳에서.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[10px] border border-[#ececec] bg-white p-4"
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#8a8d92]">
              {stat.label}
            </p>
            <p className="mt-1 text-[20px] font-bold text-[#1f1f1f]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="overflow-hidden rounded-[10px] border border-[#ececec] bg-white">
          <div className="flex items-center justify-between border-b border-[#ececec] bg-[#fafafa] px-4 py-2.5">
            <span className="text-[12px] font-semibold text-[#454950]">
              AI 강의 분석 어시스턴트
            </span>
            <span className="text-[10px] text-[#8a8d92]">
              🍀 Powered by Clover Instructor Agent
            </span>
          </div>
          <iframe
            ref={iframeRef}
            src="/instructor?embedded=1"
            title="Clover Instructor Agent"
            className="h-[720px] w-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation-by-user-activation"
            onLoad={handleIframeLoad}
          />
        </div>
        <div className="space-y-4">
          <ActivityFeed forRole="instructor" />
          <ToolCallSideCard role="instructor" />
        </div>
      </div>
    </main>
  );
}
