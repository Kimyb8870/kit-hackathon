import Link from "next/link";
import { CourseCard } from "@/components/lms/course-card";
import { CloverTeaserBanner } from "@/components/lms/clover-teaser-banner";
import { DemoScenarioCard } from "@/components/cross-agent/demo-scenario-card";
import {
  FEATURED_HOT,
  FEATURED_NEW,
  FEATURED_PRACTICAL,
  LMS_COURSES,
} from "@/lib/lms-mock-data";

// Hero "체험 강의 들어보기" deliberately pins to the only course whose
// transcripts are currently seeded in production (`course_clips`): Python 기초
// (440001). Deep-linking to any other course would boot the embedded Clover
// Learner with an empty curriculum and break the demo.
const DEMO_COURSE_ID = "550e8400-e29b-41d4-a716-446655440001";

export default function LmsHomePage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10">
      <CloverTeaserBanner />

      <DemoScenarioCard />

      {/* Hero banner */}
      <section className="relative mb-12 overflow-hidden rounded-[12px] border border-[#ececec] bg-gradient-to-br from-[#454950] via-[#5a5e65] to-[#3a3d42]">
        <div className="relative z-10 flex flex-col gap-3 px-10 py-14">
          <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-white/60">
            EduMall × Clover AI
          </span>
          <h1 className="text-[34px] font-bold leading-tight text-white">
            나만의 AI 튜터와 함께,
            <br />
            진짜로 끝까지 듣는 강의
          </h1>
          <p className="max-w-[480px] text-[14px] leading-relaxed text-white/70">
            모든 강의에 학습 보조 AI가 함께합니다. 모르는 부분은 즉시 질문하고,
            진도에 맞는 복습 퀴즈를 자동으로 받아보세요.
          </p>
          <div className="mt-2 flex gap-2">
            <Link
              href="/lms/courses"
              className="rounded-full bg-white px-6 py-2.5 text-[13px] font-semibold text-[#1f1f1f] transition-all hover:bg-white/90"
            >
              전체 강의 보기
            </Link>
            <Link
              href={`/lms/courses/${DEMO_COURSE_ID}?demo=1`}
              className="rounded-full border border-white/30 px-6 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-white/10"
            >
              체험 강의 들어보기
            </Link>
          </div>
        </div>
        {/* Decorative grid pattern */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </section>

      {/* Section: Hot */}
      <CuratedSection
        eyebrow="🔥 지금 가장 핫한 클래스"
        title="이번 주, 가장 많이 시작한 강의"
        courses={FEATURED_HOT}
      />

      {/* Section: Practical */}
      <CuratedSection
        eyebrow="💼 현업자가 듣는 진짜 실무"
        title="현직자가 직접 추천하는 실무 강의"
        courses={FEATURED_PRACTICAL}
      />

      {/* Section: New */}
      <CuratedSection
        eyebrow="✨ 신규 클래스"
        title="이번 달 새로 열린 강의"
        courses={FEATURED_NEW}
      />

      {/* All courses preview */}
      <section className="mt-16">
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#8a8d92]">
              모든 강의
            </p>
            <h2 className="mt-1 text-[20px] font-bold text-[#1f1f1f]">
              EduMall의 모든 강의
            </h2>
          </div>
          <Link
            href="/lms/courses"
            className="text-[12px] font-medium text-[#606060] hover:text-[#1f1f1f]"
          >
            더보기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {LMS_COURSES.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>
    </main>
  );
}

interface CuratedSectionProps {
  eyebrow: string;
  title: string;
  courses: ReturnType<typeof LMS_COURSES.slice>;
}

function CuratedSection({ eyebrow, title, courses }: CuratedSectionProps) {
  if (courses.length === 0) return null;
  return (
    <section className="mb-12">
      <div className="mb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#8a8d92]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[20px] font-bold text-[#1f1f1f]">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </section>
  );
}
