"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type LmsCourse, formatPrice } from "@/lib/lms-mock-data";
import { enrollInCourse } from "@/lib/api-client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

interface CourseDetailClientProps {
  course: LmsCourse;
}

type EnrollState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "success"; readonly alreadyEnrolled: boolean }
  | { readonly kind: "error"; readonly message: string };

type TabKey = "description" | "curriculum" | "reviews";

interface ClipPosition {
  chapterNo: number;
  clipNo: number;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "description", label: "강의소개" },
  { key: "curriculum", label: "커리큘럼" },
  { key: "reviews", label: "수강평" },
];

// Suggested prompts rendered as clickable chips in the "해볼 일" guide banner.
// Clicking any chip posts the `text` into the embedded Learner iframe so the
// first-time user does not have to manually retype sample questions. Kept
// verbatim with the original banner copy so the wording matches what the user
// sees on the page.
interface GuideSuggestion {
  readonly label: string;
  readonly text: string;
}

const GUIDE_SUGGESTIONS: ReadonlyArray<GuideSuggestion> = [
  {
    label: "이 개념 이해가 안돼요",
    text: "이 개념 이해가 안돼요. 쉽게 설명해주세요.",
  },
  {
    label: "관련 복습 퀴즈 내주세요",
    text: "방금 본 내용으로 복습 퀴즈를 내주세요.",
  },
  {
    label: "다음에 뭘 공부하면 좋을까요?",
    text: "이 강의 다음으로 어떤 내용을 공부하면 좋을까요?",
  },
];

export function CourseDetailClient({ course }: CourseDetailClientProps) {
  const [tab, setTab] = useState<TabKey>("description");
  const [position, setPosition] = useState<ClipPosition>({
    chapterNo: 1,
    clipNo: 1,
  });
  const [enrollState, setEnrollState] = useState<EnrollState>({ kind: "idle" });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useSupabaseUser();

  const currentClip = useMemo(() => {
    const chapter = course.curriculum.find(
      (c) => c.chapterNo === position.chapterNo
    );
    return chapter?.clips.find((c) => c.clipNo === position.clipNo) ?? null;
  }, [course.curriculum, position]);

  // Notify the embedded Clover Learner agent every time the user picks a clip.
  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      {
        type: "COURSE_CONTEXT_CHANGE",
        courseId: course.id,
        chapterNo: position.chapterNo,
        clipNo: position.clipNo,
      },
      "*"
    );
  }, [course.id, position]);

  const handleClipSelect = (chapterNo: number, clipNo: number) => {
    setPosition({ chapterNo, clipNo });
  };

  // Fire a suggested question into the embedded Learner agent. The iframe
  // picks this message up in learner-content.tsx and enqueues it via the
  // chat-store `pendingAutoMessage` mechanism so chat-container flushes it
  // once it mounts. We intentionally do NOT wait for the iframe to be ready
  // here — postMessage is lossy on our end, but the banner only appears
  // after the page itself has rendered and the iframe has already mounted,
  // so in practice the listener is always attached by click time.
  const handleSuggestionClick = (suggestion: GuideSuggestion) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      {
        type: "CLOVER_AUTO_SEND_MESSAGE",
        text: suggestion.text,
      },
      "*"
    );
  };

  // "바로 수강하기" CTA. Routes unauthenticated visitors through the login
  // flow with a redirect back here, otherwise fires enrollInCourse and
  // surfaces the result inline. A 409 "already enrolled" is treated as a
  // success so the CTA stays idempotent on re-click.
  const handleEnrollClick = async (): Promise<void> => {
    if (enrollState.kind === "loading") return;
    if (authLoading) return;

    if (!user) {
      const redirectTarget = pathname ?? `/lms/courses/${course.id}`;
      router.push(
        `/login?redirect=${encodeURIComponent(redirectTarget)}`
      );
      return;
    }

    setEnrollState({ kind: "loading" });
    const result = await enrollInCourse(user.id, course.id);
    if (!result.ok) {
      setEnrollState({
        kind: "error",
        message: result.errorMessage ?? "수강 신청에 실패했습니다.",
      });
      return;
    }
    setEnrollState({
      kind: "success",
      alreadyEnrolled: result.alreadyEnrolled,
    });
  };

  const discount = course.originalPrice
    ? Math.round((1 - course.price / course.originalPrice) * 100)
    : 0;

  // Compute the iframe URL only once per course so that subsequent clip
  // selections do not reload the embedded Learner agent. After mount, clip
  // changes are communicated via postMessage in the effect above.
  const initialIframeSrc = useMemo(
    () =>
      `/learner?embedded=1&courseId=${encodeURIComponent(
        course.id
      )}&chapterNo=1&clipNo=1`,
    [course.id]
  );

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-[11px] text-[#8a8d92]">
        <Link href="/lms" className="hover:text-[#1f1f1f]">
          홈
        </Link>
        <span>›</span>
        <Link href="/lms/courses" className="hover:text-[#1f1f1f]">
          전체 강의
        </Link>
        <span>›</span>
        <Link
          href={`/lms/courses?category=${encodeURIComponent(course.category)}`}
          className="hover:text-[#1f1f1f]"
        >
          {course.category}
        </Link>
      </nav>

      {/* Guide banner — orients first-time viewers so they know what the
          right-side iframe actually does and where to go next. Clicking a
          suggestion chip auto-sends the question into the embedded Learner
          iframe via postMessage(CLOVER_AUTO_SEND_MESSAGE). */}
      <div className="mb-5 rounded-[10px] border border-clover-200 bg-gradient-to-r from-clover-50 via-white to-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clover-100 text-sm">
            💡
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-clover-900">
              이 페이지에서 해볼 일
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-700">
              아래 질문을 누르면 오른쪽{" "}
              <span className="font-semibold">🌱 AI 튜터</span>로 자동 전송됩니다.
              Clover Learner가 강의 컨텍스트를 파악해 답변 + 복습 퀴즈를 제안해요.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GUIDE_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="group inline-flex cursor-pointer items-center gap-1 rounded-full border border-clover-200 bg-white px-2.5 py-1 text-[11px] font-medium text-clover-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-clover-400 hover:bg-clover-50 hover:text-clover-900 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-clover-300"
                >
                  <span aria-hidden>💬</span>
                  <span>{suggestion.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-2.5">
              <Link
                href="/lms/instructor-center?demo=1"
                className="inline-flex items-center gap-1 rounded-full bg-clover-600 px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-clover-700"
              >
                다음 단계: 강사센터에서 분석 보기 →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Layout: 60/40 split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        {/* LEFT — video + tabs */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* Video placeholder */}
          <div className="relative aspect-video w-full overflow-hidden rounded-[10px] bg-[#0a0a0a]">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <button
                aria-label="재생"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 transition-transform hover:scale-105"
              >
                <PlayIcon className="ml-1 h-7 w-7 text-[#1f1f1f]" />
              </button>
              <p className="text-[11px] text-white/50">
                Chapter {position.chapterNo} · Clip {position.clipNo}
                {currentClip && ` — ${currentClip.title}`}
              </p>
            </div>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div className="h-full w-1/3 bg-white/60" />
            </div>
          </div>

          {/* Title block */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-[#1f1f1f] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {course.level}
              </span>
              <span className="rounded border border-[#e5e5e5] px-1.5 py-0.5 text-[10px] text-[#606060]">
                {course.category}
              </span>
              {course.badges?.map((b) => (
                <span
                  key={b}
                  className="rounded bg-[#454950] px-1.5 py-0.5 text-[10px] font-bold text-white"
                >
                  {b}
                </span>
              ))}
            </div>
            <h1 className="text-[22px] font-bold leading-tight text-[#1f1f1f]">
              {course.title}
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#606060]">
              {course.tagline}
            </p>

            {/* Instructor + meta */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f2f2] text-[12px] font-bold text-[#606060]">
                {course.instructor.charAt(0)}
              </div>
              <div className="text-[12px]">
                <p className="font-semibold text-[#1f1f1f]">
                  {course.instructor}
                </p>
                <p className="text-[#8a8d92]">{course.instructorTitle}</p>
              </div>
              <div className="ml-auto flex items-center gap-3 text-[11px] text-[#8a8d92]">
                <span className="flex items-center gap-0.5">
                  <StarIcon className="h-3 w-3 text-[#454950]" />
                  {course.rating.toFixed(1)} (
                  {course.studentCount.toLocaleString("ko-KR")})
                </span>
                <span>·</span>
                <span>총 {course.totalHours}시간</span>
                <span>·</span>
                <span>{course.totalClips}개 클립</span>
              </div>
            </div>

            {/* Price + CTA */}
            <div className="mt-5 flex items-end justify-between rounded-[10px] border border-[#ececec] bg-white p-4">
              <div>
                {discount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-[#1f1f1f]">
                      {discount}%
                    </span>
                    <span className="text-[12px] text-[#a8abb0] line-through">
                      {formatPrice(course.originalPrice!)}원
                    </span>
                  </div>
                )}
                <div className="text-[22px] font-bold text-[#1f1f1f]">
                  {formatPrice(course.price)}원
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#1f1f1f] bg-white px-5 py-2 text-[12px] font-semibold text-[#1f1f1f] transition-colors hover:bg-[#f2f2f2]"
                  >
                    장바구니
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleEnrollClick();
                    }}
                    disabled={
                      enrollState.kind === "loading" || authLoading
                    }
                    className="rounded-full bg-[#1f1f1f] px-5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {enrollState.kind === "loading"
                      ? "처리 중…"
                      : "바로 수강하기"}
                  </button>
                </div>
                {enrollState.kind === "success" && (
                  <div className="flex flex-col gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          enrollState.alreadyEnrolled
                            ? "text-[#8a8d92]"
                            : "font-semibold text-clover-700"
                        }
                      >
                        {enrollState.alreadyEnrolled
                          ? "이미 수강 중인 강의입니다"
                          : "✓ 수강 신청 완료"}
                      </span>
                      <Link
                        href="/learner?tab=schedule"
                        className="rounded-full bg-clover-600 px-3 py-0.5 font-semibold text-white hover:bg-clover-700"
                      >
                        AI 튜터로 바로 가기 →
                      </Link>
                    </div>
                    <div className="rounded-[8px] border border-clover-100 bg-clover-50 p-2.5">
                      <p className="mb-1.5 text-[10px] leading-relaxed text-clover-800">
                        💡 수강 신청이 완료되면 Clover의 3-Agent가 연동됩니다: 학습 데이터가 강사 AI에게 전달되고, 강사 AI의 분석이 운영자 AI로 이어집니다.
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-clover-700">
                        <span>📊 이 강의의 학습 분석을 보고 싶다면</span>
                        <Link
                          href="/lms/instructor-center?demo=1"
                          className="font-semibold underline hover:text-clover-900"
                        >
                          강사센터 열기 →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                {enrollState.kind === "error" && (
                  <p className="text-[11px] font-medium text-red-600">
                    {enrollState.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="flex border-b border-[#ececec]">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`relative px-6 py-3 text-[13px] font-medium transition-colors ${
                    tab === t.key
                      ? "text-[#1f1f1f]"
                      : "text-[#8a8d92] hover:text-[#454950]"
                  }`}
                >
                  {t.label}
                  {tab === t.key && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#1f1f1f]" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {tab === "description" && (
                <div className="space-y-4 text-[13px] leading-relaxed text-[#454950]">
                  <p>{course.description}</p>
                  <div className="rounded-[8px] border border-[#ececec] bg-[#fafafa] p-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8a8d92]">
                      이 강의의 특별함
                    </p>
                    <ul className="space-y-1.5 text-[12px] text-[#454950]">
                      <li>· 수강 중 모르는 부분은 옆의 AI 튜터에게 즉시 질문</li>
                      <li>· 학습 진도에 맞춘 자동 복습 퀴즈 제공</li>
                      <li>· 클립별 핵심 개념 자동 추출 및 노트 정리</li>
                    </ul>
                  </div>
                </div>
              )}

              {tab === "curriculum" && (
                <CurriculumList
                  course={course}
                  position={position}
                  onSelect={handleClipSelect}
                />
              )}

              {tab === "reviews" && (
                <div className="space-y-4">
                  {course.reviews.length === 0 ? (
                    <p className="py-10 text-center text-[12px] text-[#8a8d92]">
                      아직 등록된 수강평이 없습니다.
                    </p>
                  ) : (
                    course.reviews.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-[8px] border border-[#ececec] bg-white p-4"
                      >
                        <div className="mb-1 flex items-center gap-2 text-[12px]">
                          <span className="font-semibold text-[#1f1f1f]">
                            {r.author}
                          </span>
                          <span className="flex items-center gap-0.5 text-[#454950]">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-3 w-3 ${
                                  i < r.rating
                                    ? "text-[#454950]"
                                    : "text-[#e5e5e5]"
                                }`}
                              />
                            ))}
                          </span>
                          <span className="text-[11px] text-[#a8abb0]">
                            {r.date}
                          </span>
                        </div>
                        <p className="text-[12px] leading-relaxed text-[#606060]">
                          {r.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — sticky iframe */}
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="flex h-full flex-col overflow-hidden rounded-[10px] border border-[#ececec] bg-white">
            <div className="flex items-center justify-between border-b border-[#ececec] bg-[#fafafa] px-3 py-2">
              <span className="text-[11px] font-semibold text-[#454950]">
                AI 학습 도우미
              </span>
              <span className="text-[10px] text-[#8a8d92]">
                🍀 Powered by Clover
              </span>
            </div>
            <iframe
              ref={iframeRef}
              src={initialIframeSrc}
              title="Clover Learner Agent"
              className="h-full min-h-[600px] w-full flex-1 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation-by-user-activation"
            />
          </div>
        </aside>
      </div>
    </main>
  );
}

interface CurriculumListProps {
  course: LmsCourse;
  position: ClipPosition;
  onSelect: (chapterNo: number, clipNo: number) => void;
}

function CurriculumList({ course, position, onSelect }: CurriculumListProps) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#8a8d92]">
        총 {course.curriculum.length}개 챕터 · {course.totalClips}개 클립
      </p>
      {course.curriculum.map((chapter) => (
        <div
          key={chapter.chapterNo}
          className="overflow-hidden rounded-[8px] border border-[#ececec] bg-white"
        >
          <div className="border-b border-[#ececec] bg-[#fafafa] px-4 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a8d92]">
              Chapter {chapter.chapterNo}
            </p>
            <p className="text-[13px] font-semibold text-[#1f1f1f]">
              {chapter.title}
            </p>
          </div>
          <ul>
            {chapter.clips.map((clip) => {
              const active =
                position.chapterNo === chapter.chapterNo &&
                position.clipNo === clip.clipNo;
              return (
                <li key={clip.clipNo}>
                  <button
                    type="button"
                    onClick={() => onSelect(chapter.chapterNo, clip.clipNo)}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 border-b border-l-2 border-[#f2f2f2] py-2.5 pl-[14px] pr-4 text-left transition-colors last:border-b-0 ${
                      active
                        ? "border-l-[#1f1f1f] bg-[#f2f2f2]"
                        : "border-l-transparent bg-white hover:bg-[#fafafa]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                          active
                            ? "bg-[#1f1f1f] text-white"
                            : "bg-[#f2f2f2] text-[#8a8d92]"
                        }`}
                      >
                        {active ? (
                          <PlayIcon className="h-3 w-3" />
                        ) : (
                          clip.clipNo
                        )}
                      </span>
                      <span
                        className={`text-[12px] ${
                          active
                            ? "font-semibold text-[#1f1f1f]"
                            : "text-[#454950]"
                        }`}
                      >
                        {clip.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#a8abb0]">
                      {clip.duration}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}
