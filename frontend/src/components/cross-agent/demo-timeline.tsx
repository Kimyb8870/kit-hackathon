"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface TimelineStep {
  readonly t: string;
  readonly label: string;
  readonly description: string;
}

// Copy is intentionally abstract — no specific course/technology names —
// so the banner reads correctly on every LMS page regardless of which
// course the user is currently viewing. Previously these descriptions
// named "Python async" and caused cognitive dissonance on unrelated
// courses (e.g. pandas/데이터분석) where the seed course actually lives.
const STEPS: ReadonlyArray<TimelineStep> = [
  {
    t: "T+0",
    label: "🎓 학습자",
    description: "어려운 개념 질문 → 복습 제안 받음",
  },
  {
    t: "T+15s",
    label: "🍃 강사",
    description: "struggling concept 집계 → 보충 클립 제안",
  },
  {
    t: "T+30s",
    label: "🌿 운영자",
    description: "카테고리 수요 분석 → 프로모션 결정",
  },
];

function DemoTimelineInner() {
  const params = useSearchParams();
  if (params.get("demo") !== "1") return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2">
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 overflow-x-auto">
        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-900">
          🎬 Demo Mode
        </span>
        <div className="flex items-center gap-2">
          {STEPS.map((step, idx) => (
            <div key={step.t} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-sm">
                <span className="text-[10px] font-bold text-amber-700">
                  {step.t}
                </span>
                <span className="text-[11px]">{step.label}</span>
                <span className="text-[10px] text-[#8a8d92]">
                  {step.description}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <span className="text-amber-600">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Next.js 14+ requires useSearchParams() to be wrapped in Suspense to avoid
// de-opting the entire layout into client-side rendering during build.
export function DemoTimeline() {
  return (
    <Suspense fallback={null}>
      <DemoTimelineInner />
    </Suspense>
  );
}
