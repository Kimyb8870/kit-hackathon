import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sprout,
  Leaf,
  TreePine,
  ArrowRight,
  Sparkles,
  Store,
  PlayCircle,
} from "lucide-react";

const AGENTS = [
  {
    href: "/learner",
    emoji: "🌱",
    title: "Learner Agent",
    headline: "학습 성공을 위한 AI",
    description:
      "프로필 기반 강의 추천, 망각곡선 복습, 영상 단위 Q&A로 학습자의 끝까지 가는 여정을 지원합니다.",
    bullets: [
      "프로필 맞춤 강의 추천",
      "망각곡선 기반 복습 일정",
      "영상 단위 Q&A · 코드 리뷰",
    ],
    bg: "from-clover-50 via-clover-100/60 to-white",
    iconBg: "from-clover-300 to-clover-400",
    cta: "Learner로 시작하기",
    icon: Sprout,
  },
  {
    href: "/instructor",
    emoji: "🍃",
    title: "Instructor Agent",
    headline: "강사를 돕는 교수 보조 AI",
    description:
      "학습자 어려움을 자동 분석하고, 콘텐츠 갭과 자주 묻는 질문을 요약해 강의 개선 포인트를 제안합니다.",
    bullets: [
      "어려움 겪는 학습자 자동 식별",
      "콘텐츠 갭 분석",
      "Q&A 요약 · 답변 초안",
    ],
    bg: "from-emerald-50 via-clover-100/70 to-white",
    iconBg: "from-clover-400 to-clover-500",
    cta: "Instructor 둘러보기",
    icon: Leaf,
  },
  {
    href: "/platform",
    emoji: "🌿",
    title: "Platform Agent",
    headline: "비즈니스 의사결정 AI",
    description:
      "수요 예측, 시장 트렌드, 신규 강의 기회까지 — 운영자가 한눈에 의사결정할 수 있는 인사이트를 제공합니다.",
    bullets: [
      "강의 카테고리 수요 예측",
      "시장 트렌드 모니터링",
      "프로모션 · 신규 강의 제안",
    ],
    bg: "from-teal-50 via-clover-100/60 to-white",
    iconBg: "from-clover-500 to-clover-600",
    cta: "Platform 둘러보기",
    icon: TreePine,
  },
] as const;

const TECH_STACK = [
  "LangGraph",
  "FastAPI",
  "RAG · pgvector",
  "GPT-4o-mini",
  "Next.js 16",
  "Supabase",
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-clover-50/40 via-white to-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-clover-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-clover-300/30 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-24 text-center">
          <Badge className="bg-clover-100 text-clover-700 ring-1 ring-clover-200">
            <Sparkles className="mr-1.5 h-3 w-3" />
            KIT 바이브코딩 2026 · KEG 한국교육그룹
          </Badge>

          <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-clover-900 sm:text-6xl">
            <span className="text-7xl drop-shadow-[0_4px_8px_rgba(16,185,129,0.25)]">
              🍀
            </span>{" "}
            <span className="bg-gradient-to-r from-clover-600 via-clover-500 to-clover-400 bg-clip-text text-transparent">
              Clover
            </span>
          </h1>

          <p className="max-w-2xl text-pretty text-xl font-medium text-clover-800 sm:text-2xl">
            교육의 3 주체를 위한 AI 오케스트레이터
          </p>
          <p className="max-w-xl text-base text-gray-600">
            <span className="font-semibold text-clover-700">
              &ldquo;교육에 행운을, 모두에게&rdquo;
            </span>
            <br />
            학습자, 강사, 플랫폼 운영자가 같은 데이터에서 각자의 인사이트를
            얻습니다.
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/learner">
              <Button
                size="lg"
                className="h-11 bg-clover-500 px-6 text-base font-semibold text-white hover:bg-clover-600"
              >
                Learner로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/instructor">
              <Button
                size="lg"
                variant="outline"
                className="h-11 border-clover-200 bg-white px-6 text-base font-semibold text-clover-700 hover:bg-clover-50"
              >
                Instructor / Platform 보기
              </Button>
            </Link>
            <Link href="/lms">
              <Button
                size="lg"
                variant="outline"
                className="h-11 border-clover-200 bg-white px-6 text-base font-semibold text-clover-700 hover:bg-clover-50"
              >
                <Store className="h-4 w-4" />
                LMS 통합 데모
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* LMS Demo Scenario CTA */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-12">
        <div className="relative overflow-hidden rounded-3xl border border-clover-200 bg-gradient-to-br from-clover-50 via-white to-emerald-50 p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-clover-300/30 blur-3xl"
          />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-clover-500 to-clover-600 text-white shadow-sm">
                <PlayCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-clover-600">
                  🎬 30초 데모 시나리오
                </p>
                <h2 className="mt-1 text-xl font-bold text-clover-900 sm:text-2xl">
                  기존 LMS에 Clover를 붙이면 이렇게 작동합니다
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
                  EduMall(가상의 LMS) 안에 Clover 3-Agent가 그대로 embed되어
                  <strong className="font-semibold text-clover-800">
                    {" "}
                    강사·운영자가 Cross-Agent 데이터를 실시간으로{" "}
                  </strong>
                  받는 모습을 확인해보세요.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:shrink-0">
              <Link href="/lms?demo=1">
                <Button className="h-11 w-full bg-clover-600 px-6 text-sm font-semibold text-white hover:bg-clover-700 md:w-auto">
                  데모 모드로 시작
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/lms/instructor-center?demo=1">
                <Button
                  variant="outline"
                  className="h-10 w-full border-clover-200 bg-white text-xs font-semibold text-clover-700 hover:bg-clover-50 md:w-auto"
                >
                  강사센터 바로가기 →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Agent Cards */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {AGENTS.map((agent) => (
            <Link
              key={agent.href}
              href={agent.href}
              className={`group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-clover-100 bg-gradient-to-br ${agent.bg} p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl`}
            >
              <div
                aria-hidden
                className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${agent.iconBg} opacity-20 blur-2xl transition-opacity group-hover:opacity-30`}
              />

              <div className="relative flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-clover-100"
                >
                  {agent.emoji}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-clover-600">
                    {agent.title}
                  </span>
                  <span className="text-lg font-semibold text-clover-900">
                    {agent.headline}
                  </span>
                </div>
              </div>

              <p className="relative text-sm leading-relaxed text-gray-600">
                {agent.description}
              </p>

              <ul className="relative space-y-1.5 text-sm text-clover-800">
                {agent.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-clover-500" />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="relative mt-auto flex items-center justify-between border-t border-clover-100 pt-4">
                <span className="text-sm font-semibold text-clover-700">
                  {agent.cta}
                </span>
                <ArrowRight className="h-4 w-4 text-clover-600 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Data Flow Diagram */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-clover-600">
            How it works
          </p>
          <h2 className="mt-2 text-2xl font-bold text-clover-900 sm:text-3xl">
            하나의 데이터, 세 가지 인사이트
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            학습 활동이 한곳에 쌓이고, 세 에이전트가 각자의 관점으로 데이터를
            해석합니다.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-clover-100 bg-white p-6 shadow-sm">
          <svg
            viewBox="0 0 800 280"
            className="h-auto w-full"
            role="img"
            aria-label="Clover 데이터 흐름 다이어그램"
          >
            <defs>
              <linearGradient id="centerGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="#10B981" />
              </marker>
            </defs>

            {/* Center: Learning Activity Hub */}
            <g>
              <rect
                x="320"
                y="105"
                width="160"
                height="70"
                rx="16"
                fill="url(#centerGrad)"
              />
              <text
                x="400"
                y="138"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#fff"
              >
                Learning Activity Hub
              </text>
              <text
                x="400"
                y="158"
                textAnchor="middle"
                fontSize="11"
                fill="#ECFDF5"
              >
                Supabase + pgvector
              </text>
            </g>

            {/* Left: Learner */}
            <g>
              <rect
                x="40"
                y="110"
                width="180"
                height="60"
                rx="14"
                fill="#ECFDF5"
                stroke="#A7F3D0"
                strokeWidth="1.5"
              />
              <text
                x="130"
                y="135"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#065F46"
              >
                🌱 Learner Agent
              </text>
              <text
                x="130"
                y="153"
                textAnchor="middle"
                fontSize="10"
                fill="#047857"
              >
                추천 · 복습 · Q&A
              </text>
            </g>
            <line
              x1="220"
              y1="140"
              x2="318"
              y2="140"
              stroke="#10B981"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <line
              x1="318"
              y1="155"
              x2="220"
              y2="155"
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="4 3"
              markerEnd="url(#arrow)"
            />

            {/* Top right: Instructor */}
            <g>
              <rect
                x="580"
                y="30"
                width="180"
                height="60"
                rx="14"
                fill="#ECFDF5"
                stroke="#A7F3D0"
                strokeWidth="1.5"
              />
              <text
                x="670"
                y="55"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#065F46"
              >
                🍃 Instructor Agent
              </text>
              <text
                x="670"
                y="73"
                textAnchor="middle"
                fontSize="10"
                fill="#047857"
              >
                어려움 분석 · 콘텐츠 갭
              </text>
            </g>
            <line
              x1="480"
              y1="115"
              x2="582"
              y2="80"
              stroke="#10B981"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />

            {/* Bottom right: Platform */}
            <g>
              <rect
                x="580"
                y="190"
                width="180"
                height="60"
                rx="14"
                fill="#ECFDF5"
                stroke="#A7F3D0"
                strokeWidth="1.5"
              />
              <text
                x="670"
                y="215"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#065F46"
              >
                🌿 Platform Agent
              </text>
              <text
                x="670"
                y="233"
                textAnchor="middle"
                fontSize="10"
                fill="#047857"
              >
                수요 예측 · 트렌드
              </text>
            </g>
            <line
              x1="480"
              y1="165"
              x2="582"
              y2="200"
              stroke="#10B981"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
          </svg>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mx-auto flex flex-col items-center gap-3 px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-clover-600">
          Powered by
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {TECH_STACK.map((tech) => (
            <Badge
              key={tech}
              className="border border-clover-100 bg-white text-xs text-clover-700"
            >
              {tech}
            </Badge>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-clover-100 bg-clover-50/40 py-6 text-center text-xs text-clover-700">
        🍀 Clover · KIT 바이브코딩 공모전 2026 · KEG 한국교육그룹
      </footer>
    </div>
  );
}
