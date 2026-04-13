"use client";

import { useEffect, useRef, useState } from "react";
import {
  getPlatformDashboard,
  type DashboardSource,
} from "@/lib/api-client";
import type { PlatformDashboard } from "@/types/platform";
import Link from "next/link";
import { ActivityFeed } from "@/components/cross-agent/activity-feed";
import { ToolCallSideCard } from "@/components/cross-agent/tool-call-side-card";

// Demo operator context. Content lead persona focused on 프로그래밍 category
// so the platform agent's tool prefill has something plausible to work with.
const DEMO_OPERATOR_CONTEXT = {
  operator_role: "content_lead",
  focus_categories: ["프로그래밍"] as ReadonlyArray<string>,
  time_window_days: 30,
} as const;

interface StatCardData {
  readonly label: string;
  readonly value: string;
}

const STAT_LABELS: ReadonlyArray<string> = [
  "카테고리 수",
  "트렌딩 토픽",
  "제안 프로모션",
  "활성 수요",
];

function dashboardToStats(
  data: PlatformDashboard,
  source: DashboardSource
): ReadonlyArray<StatCardData> {
  const activeDemand = data.demand.reduce(
    (acc, d) => acc + d.searchVolume,
    0
  );
  return [
    { label: "카테고리 수", value: String(data.demand.length) },
    { label: "트렌딩 토픽", value: String(data.trends.length) },
    { label: "제안 프로모션", value: String(data.promotions.length) },
    {
      label: "활성 수요",
      value: source === "mock" ? "—" : String(activeDemand),
    },
  ];
}

export default function OperatorCenterPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dashboard, setDashboard] = useState<PlatformDashboard | null>(null);
  const [source, setSource] = useState<DashboardSource>("live");

  useEffect(() => {
    let cancelled = false;
    void getPlatformDashboard()
      .then((res) => {
        if (cancelled) return;
        setDashboard(res.data);
        setSource(res.source);
      })
      .catch(() => {
        if (cancelled) return;
        setDashboard({ demand: [], trends: [], promotions: [] });
        setSource("live");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleIframeLoad = (): void => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      {
        type: "clover:lms_context",
        role: "platform",
        payload: {
          operator_role: DEMO_OPERATOR_CONTEXT.operator_role,
          focus_categories: DEMO_OPERATOR_CONTEXT.focus_categories,
          time_window_days: DEMO_OPERATOR_CONTEXT.time_window_days,
        },
      },
      "*"
    );
  };

  const isLoadingStats = dashboard === null;
  const stats = isLoadingStats ? null : dashboardToStats(dashboard, source);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8">
      <div className="mb-5 rounded-[10px] border border-clover-200 bg-gradient-to-r from-clover-50 via-white to-emerald-50 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="text-base" aria-hidden>
              🌿
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-clover-700">
                Clover Platform Agent 활성화
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">
                이 페이지는 EduMall 운영자센터에 Clover 운영 에이전트가 그대로
                embed된 뷰입니다. 오른쪽{" "}
                <strong className="font-semibold text-clover-800">
                  Cross-Agent Activity
                </strong>
                에는 강사 에이전트가 방금 생성한 struggle 리포트가 모여 운영
                의사결정에 반영됩니다.
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
          <span className="font-semibold text-clover-700">데모 시나리오:</span>
          <Link
            href="/lms/courses/550e8400-e29b-41d4-a716-446655440001?demo=1"
            className="inline-flex items-center gap-1 rounded-full border border-clover-300 bg-white px-3 py-1 font-semibold text-clover-700 transition-colors hover:bg-clover-50"
          >
            🎓 학습자 뷰로 돌아가기
          </Link>
          <Link
            href="/lms/instructor-center?demo=1"
            className="inline-flex items-center gap-1 rounded-full border border-clover-300 bg-white px-3 py-1 font-semibold text-clover-700 transition-colors hover:bg-clover-50"
          >
            🍃 강사센터
          </Link>
          <span className="text-gray-500">
            3-Agent 흐름이 완성되었습니다
          </span>
        </div>
      </div>
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#8a8d92]">
          EduMall 운영자센터
        </p>
        <h1 className="mt-1 text-[24px] font-bold text-[#1f1f1f]">
          플랫폼 운영 대시보드
        </h1>
        <p className="mt-1 text-[12px] text-[#8a8d92]">
          전체 강의 품질, 학습 트렌드, 카테고리별 매출 분석을 한눈에 확인하세요.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoadingStats || stats === null
          ? STAT_LABELS.map((label) => (
              <div
                key={label}
                className="rounded-[10px] border border-[#ececec] bg-white p-4"
                aria-busy="true"
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#8a8d92]">
                  {label}
                </p>
                <div className="mt-1.5 h-6 w-14 animate-pulse rounded bg-clover-100" />
              </div>
            ))
          : stats.map((stat) => (
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
              AI 플랫폼 분석 어시스턴트
            </span>
            <span className="text-[10px] text-[#8a8d92]">
              🍀 Powered by Clover Platform Agent
            </span>
          </div>
          <iframe
            ref={iframeRef}
            src="/platform?embedded=1"
            title="Clover Platform Agent"
            className="h-[720px] w-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation-by-user-activation"
            onLoad={handleIframeLoad}
          />
        </div>
        <div className="space-y-4">
          <ActivityFeed forRole="platform" />
          <ToolCallSideCard role="platform" />
        </div>
      </div>
    </main>
  );
}
