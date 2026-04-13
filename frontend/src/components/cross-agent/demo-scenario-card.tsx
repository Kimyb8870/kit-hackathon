import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

interface DemoScenarioStep {
  readonly order: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly cta: string;
  readonly accent: string;
}

// Static demo walkthrough surfaced on the LMS home so first-time viewers
// (judges, stakeholders) have a single, deterministic 30-second flow to
// follow. The card is intentionally prescriptive — it picks the handful of
// screens that best show Cross-Agent handoff, and supplies direct deep-
// links with ?demo=1 so DemoTimeline + CrossAgentToast are primed.
//
// Copy is deliberately abstract (no specific course/technology names) so
// the scenario reads consistently regardless of which seed course the
// Learner link lands on. Earlier iterations hard-coded "Python async" and
// conflicted with the actual pandas/데이터분석 seed course.
const SCENARIO_STEPS: ReadonlyArray<DemoScenarioStep> = [
  {
    order: "T+0",
    title: "🎓 학습자가 어려움을 겪음",
    description:
      "강의를 듣다가 어려운 개념 질문 → Learner Agent가 복습 제안 + struggle 이벤트 발행. 이 데이터가 강사센터로 자동 전달됩니다.",
    href: "/learner?demo=1",
    cta: "Learner로 시작",
    accent: "from-blue-50 to-white border-blue-100",
  },
  {
    order: "T+15s",
    title: "🍃 강사가 LMS에서 분석 확인",
    description:
      "학습자의 어려움 데이터를 기반으로 Instructor Agent가 struggling concept를 자동 집계해 보충 클립을 제안합니다. 분석 결과가 운영자센터로 전달됩니다.",
    href: "/lms/instructor-center?demo=1",
    cta: "강사센터 열기",
    accent: "from-clover-50 to-white border-clover-100",
  },
  {
    order: "T+30s",
    title: "🌿 운영자가 트렌드 포착",
    description:
      "강사의 분석과 학습자 트렌드를 종합하여 Platform Agent가 카테고리 수요를 분석하고 프로모션을 제안합니다.",
    href: "/lms/operator-center?demo=1",
    cta: "운영자센터 열기",
    accent: "from-emerald-50 to-white border-emerald-100",
  },
];

export function DemoScenarioCard() {
  return (
    <section className="mb-10 overflow-hidden rounded-[12px] border border-clover-200 bg-gradient-to-br from-white via-clover-50/40 to-emerald-50/60 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-clover-100 bg-white/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-clover-500 to-clover-700 text-white shadow-sm">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-clover-700">
              🎬 데모 시나리오
            </p>
            <h2 className="mt-0.5 text-[17px] font-bold text-clover-900">
              30초 안에 Cross-Agent 흐름 체험하기
            </h2>
            <p className="mt-0.5 text-[12px] text-gray-600">
              세 단계를 순서대로 클릭하면 학습자 → 강사 → 운영자로 데이터가
              흘러가는 과정을 눈으로 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-3">
        {SCENARIO_STEPS.map((step, idx) => (
          <Link
            key={step.order}
            href={step.href}
            className={`group relative flex flex-col gap-3 rounded-xl border bg-gradient-to-br ${step.accent} p-4 transition-all hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-clover-700 shadow-sm ring-1 ring-clover-100">
                {step.order}
              </span>
              <span className="text-[10px] font-semibold text-clover-500">
                Step {idx + 1}
              </span>
            </div>
            <h3 className="text-[14px] font-bold text-[#1f1f1f]">
              {step.title}
            </h3>
            <p className="text-[11px] leading-relaxed text-gray-600">
              {step.description}
            </p>
            <div className="mt-auto flex items-center gap-1 pt-2 text-[11px] font-semibold text-clover-700">
              {step.cta}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
