import type { LearnerProfile } from "@/types/profile";
import type { ForgettingCurvePoint, ReviewItem } from "@/types/dashboard";
import type {
  ContentGap,
  InstructorDashboard,
  QASummary,
  StruggleLearner,
} from "@/types/instructor";
import type {
  DemandPoint,
  PlatformDashboard,
  PromotionSuggestion,
  TrendItem,
} from "@/types/platform";
import {
  MOCK_FORGETTING_CURVE,
  MOCK_REVIEW_SCHEDULE,
  MOCK_INSTRUCTOR_DASHBOARD,
  MOCK_PLATFORM_DASHBOARD,
} from "@/lib/constants";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RawProfileResponse {
  readonly user_id?: string;
  readonly career_goal?: string | null;
  readonly experience_level?: string | null;
  readonly available_minutes?: number | null;
  readonly final_goal?: string | null;
  readonly enrolled_courses?: ReadonlyArray<string> | null;
}

function bodyToProfile(
  raw: RawProfileResponse,
  fallbackUserId: string
): LearnerProfile {
  const level = raw.experience_level;
  const normalizedLevel: LearnerProfile["experienceLevel"] =
    level === "beginner" || level === "intermediate" || level === "advanced"
      ? level
      : "beginner";
  return {
    userId: raw.user_id ?? fallbackUserId,
    careerGoal: raw.career_goal ?? "",
    experienceLevel: normalizedLevel,
    availableMinutes:
      typeof raw.available_minutes === "number" ? raw.available_minutes : 30,
    finalGoal: raw.final_goal ?? "",
    enrolledCourses: raw.enrolled_courses ?? [],
  };
}

export async function getProfile(
  userId: string
): Promise<LearnerProfile | null> {
  if (USE_MOCK) {
    await delay(300);
    return {
      userId,
      careerGoal: "데이터 분석가",
      experienceLevel: "beginner",
      availableMinutes: 30,
      finalGoal: "Python으로 데이터 분석 프로젝트 완성",
      enrolledCourses: ["course-python-basics"],
    };
  }

  const response = await fetch(
    `${API_BASE}/api/v1/profiles/${encodeURIComponent(userId)}`
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Get profile failed: ${response.status}`);
  }
  const raw = (await response.json()) as RawProfileResponse;
  return bodyToProfile(raw, userId);
}

function profileToBody(profile: LearnerProfile): Record<string, unknown> {
  return {
    user_id: profile.userId,
    career_goal: profile.careerGoal,
    experience_level: profile.experienceLevel,
    available_minutes: profile.availableMinutes,
    final_goal: profile.finalGoal,
    enrolled_courses: profile.enrolledCourses,
  };
}

export async function createProfile(
  profile: LearnerProfile
): Promise<LearnerProfile> {
  if (USE_MOCK) {
    await delay(500);
    return profile;
  }

  const response = await fetch(`${API_BASE}/api/v1/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileToBody(profile)),
  });

  if (!response.ok) {
    throw new Error(`Create profile failed: ${response.status}`);
  }
  // Backend returns snake_case (career_goal, available_minutes, ...). Without
  // this conversion, callers that read camelCase fields (e.g. profile/page
  // formStateFromProfile) get undefined and crash on `.trim()`.
  const raw = (await response.json()) as RawProfileResponse;
  return bodyToProfile(raw, profile.userId);
}

export async function updateProfile(
  profile: LearnerProfile
): Promise<LearnerProfile> {
  if (USE_MOCK) {
    await delay(300);
    return profile;
  }

  const response = await fetch(
    `${API_BASE}/api/v1/profiles/${encodeURIComponent(profile.userId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileToBody(profile)),
    }
  );

  if (!response.ok) {
    throw new Error(`Update profile failed: ${response.status}`);
  }
  // Same snake_case → camelCase conversion as createProfile.
  const raw = (await response.json()) as RawProfileResponse;
  return bodyToProfile(raw, profile.userId);
}

export async function getDashboard(userId: string): Promise<{
  readonly forgettingCurve: ReadonlyArray<ForgettingCurvePoint>;
  readonly reviewSchedule: ReadonlyArray<ReviewItem>;
}> {
  if (USE_MOCK) {
    await delay(400);
    return {
      forgettingCurve: MOCK_FORGETTING_CURVE,
      reviewSchedule: MOCK_REVIEW_SCHEDULE,
    };
  }

  const [curveRes, scheduleRes] = await Promise.all([
    fetch(`${API_BASE}/api/v1/review/curve/${userId}`),
    fetch(`${API_BASE}/api/v1/review/schedule/${userId}`),
  ]);

  const curveData = curveRes.ok ? await curveRes.json() : null;
  const scheduleData = scheduleRes.ok ? await scheduleRes.json() : { due_items: [] };

  // Backend returns { user_id, period_days, daily_retention, concept_curves }
  // We need to transform concept_curves into ForgettingCurvePoint[] format
  // or fall back to mock data when no real data exists yet
  const forgettingCurve = parseForgettingCurve(curveData);

  return {
    forgettingCurve:
      forgettingCurve.length > 0 ? forgettingCurve : MOCK_FORGETTING_CURVE,
    reviewSchedule: Array.isArray(scheduleData.due_items)
      ? scheduleData.due_items
      : [],
  };
}

function parseForgettingCurve(
  data: unknown
): ReadonlyArray<ForgettingCurvePoint> {
  if (!data || typeof data !== "object") return [];

  // If backend already returns an array of ForgettingCurvePoint, use it directly
  if (Array.isArray(data)) {
    return data.filter(
      (p: Record<string, unknown>) =>
        typeof p.day === "number" &&
        typeof p.retentionWithReview === "number" &&
        typeof p.retentionWithout === "number"
    );
  }

  const obj = data as Record<string, unknown>;
  const conceptCurves = obj.concept_curves;

  // If concept_curves exist, build chart data from the first concept's projections
  // combined with the theoretical decay (no review) curve
  if (Array.isArray(conceptCurves) && conceptCurves.length > 0) {
    const firstConcept = conceptCurves[0] as Record<string, unknown>;
    const projections = firstConcept.projections;
    if (Array.isArray(projections) && projections.length > 0) {
      return projections.map((p: Record<string, unknown>) => {
        const day = (p.day as number) || 0;
        const retentionWithReview = (p.retention_pct as number) || 0;
        // Theoretical decay without review: e^(-t/2) * 100
        const retentionWithout = Math.max(
          20,
          100 * Math.exp(-day * 0.1)
        );
        return { day, retentionWithReview, retentionWithout };
      });
    }
  }

  return [];
}

/**
 * Result of a course enrollment attempt.
 *
 * `ok` is true when the learner is enrolled — whether because the backend
 * added the course just now (status 200) or because the row already carried
 * it (status 409 "Already enrolled"). The "already enrolled" branch is kept
 * idempotent on the UI side so clicking 바로 수강하기 twice just routes the
 * learner to their tutor view.
 */
export interface EnrollResult {
  readonly ok: boolean;
  readonly alreadyEnrolled: boolean;
  readonly errorMessage: string | null;
}

export async function enrollInCourse(
  userId: string,
  courseId: string
): Promise<EnrollResult> {
  if (USE_MOCK) {
    await delay(300);
    return { ok: true, alreadyEnrolled: false, errorMessage: null };
  }

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE}/api/v1/profiles/${encodeURIComponent(userId)}/enroll`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId }),
      }
    );
  } catch {
    return {
      ok: false,
      alreadyEnrolled: false,
      errorMessage: "네트워크 오류로 수강 신청을 완료하지 못했습니다.",
    };
  }

  if (response.status === 409) {
    // Backend treats repeated enrollment as an error, but for the UI this is
    // just "you're already in" — surface it as success with a flag so the
    // caller can show an idempotent toast.
    return { ok: true, alreadyEnrolled: true, errorMessage: null };
  }

  if (response.status === 404) {
    return {
      ok: false,
      alreadyEnrolled: false,
      errorMessage: "프로필이 없습니다. 온보딩을 먼저 완료해 주세요.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      alreadyEnrolled: false,
      errorMessage: `수강 신청 실패 (${response.status})`,
    };
  }

  return { ok: true, alreadyEnrolled: false, errorMessage: null };
}

export async function submitQuiz(
  userId: string,
  conceptId: string,
  answer: string
): Promise<{ readonly correct: boolean; readonly explanation: string }> {
  if (USE_MOCK) {
    await delay(600);
    return {
      correct: Math.random() > 0.4,
      explanation:
        "이 문제는 Python의 range 함수에 대한 이해를 테스트합니다. range(start, stop)에서 stop은 포함되지 않습니다.",
    };
  }

  const response = await fetch(`${API_BASE}/api/v1/quiz/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, concept_id: conceptId, answer }),
  });

  if (!response.ok) {
    throw new Error(`Submit quiz failed: ${response.status}`);
  }
  return response.json();
}

export async function submitQuizResult(data: {
  readonly userId: string;
  readonly conceptId: string;
  readonly isCorrect: boolean;
  readonly responseTimeMs: number;
}): Promise<{ readonly success: boolean }> {
  if (USE_MOCK) {
    await delay(300);
    return { success: true };
  }

  const response = await fetch(`${API_BASE}/api/v1/quiz/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: data.userId,
      concept_id: data.conceptId,
      is_correct: data.isCorrect,
      response_time_ms: data.responseTimeMs,
    }),
  });

  if (!response.ok) {
    throw new Error(`Submit quiz result failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Source label for dashboard data — `live` means it came from the backend
 * (even if the backend returned empty arrays); `mock` means we fell back to
 * static demo data because of a network failure.
 */
export type DashboardSource = "live" | "mock";

export interface InstructorDashboardResult {
  readonly source: DashboardSource;
  readonly data: InstructorDashboard;
}

export interface PlatformDashboardResult {
  readonly source: DashboardSource;
  readonly data: PlatformDashboard;
}

const EMPTY_INSTRUCTOR_DATA: InstructorDashboard = {
  struggles: [],
  contentGaps: [],
  qaSummary: [],
};

/**
 * Instructor Agent dashboard.
 *
 * Calls the live backend insights endpoint and maps the snake_case payload
 * onto the camelCase view model the UI expects. Empty arrays from the backend
 * are passed through as empty arrays — we no longer silently swap in mock
 * data when there is "no activity yet". Mock fallback is reserved for hard
 * network failures (server down, offline) so the demo can survive a flaky
 * backend without misleading the viewer.
 */
export async function getInstructorDashboard(
  _instructorId: string
): Promise<InstructorDashboardResult> {
  if (USE_MOCK) {
    await delay(350);
    return { source: "mock", data: MOCK_INSTRUCTOR_DASHBOARD };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/v1/instructor/insights`);
  } catch {
    // True network failure (offline / DNS / connection refused). Fall back
    // to mock so the UI still renders something — but flag it as mock.
    return { source: "mock", data: MOCK_INSTRUCTOR_DASHBOARD };
  }

  if (!response.ok) {
    // The backend explicitly answered with an error. Surface an empty live
    // dataset rather than silently masking it with mock data.
    return { source: "live", data: EMPTY_INSTRUCTOR_DATA };
  }

  const raw = (await response.json()) as unknown;
  return { source: "live", data: parseInstructorInsights(raw) };
}

/**
 * Platform Agent dashboard.
 *
 * Combines `/api/v1/platform/recommendations` (trends + promotions) and
 * `/api/v1/platform/demand` (per-category demand). Same fallback policy as
 * the instructor dashboard: real network failures fall back to mock, HTTP
 * errors / empty data are passed through as live empties.
 */
export async function getPlatformDashboard(): Promise<PlatformDashboardResult> {
  if (USE_MOCK) {
    await delay(350);
    return { source: "mock", data: MOCK_PLATFORM_DASHBOARD };
  }

  let recResponse: Response;
  let demandResponse: Response;
  try {
    [recResponse, demandResponse] = await Promise.all([
      fetch(`${API_BASE}/api/v1/platform/recommendations`),
      fetch(`${API_BASE}/api/v1/platform/demand`),
    ]);
  } catch {
    return { source: "mock", data: MOCK_PLATFORM_DASHBOARD };
  }

  const recRaw = recResponse.ok ? ((await recResponse.json()) as unknown) : null;
  const demandRaw = demandResponse.ok
    ? ((await demandResponse.json()) as unknown)
    : null;

  return {
    source: "live",
    data: parsePlatformDashboard(recRaw, demandRaw),
  };
}

// ----------------------------------------------------------------------
// Backend → frontend mappers
// ----------------------------------------------------------------------

interface RawStruggle {
  readonly concept_id?: string;
  readonly attempts?: number;
  readonly correct?: number;
  readonly accuracy?: number;
}

interface RawContentGap {
  readonly concept_id?: string;
  readonly question_count?: number;
  readonly clip_count?: number;
  readonly gap_score?: number;
}

interface RawQAConcept {
  readonly concept_id?: string;
  readonly quiz_attempts?: number;
  readonly quiz_correct?: number;
  readonly qa_questions?: number;
}

interface RawInstructorInsights {
  readonly struggles_top5?: { readonly struggles?: ReadonlyArray<RawStruggle> };
  readonly content_gaps?: { readonly gaps?: ReadonlyArray<RawContentGap> };
  readonly qa_stats?: { readonly concepts?: ReadonlyArray<RawQAConcept> };
}

// Backend load tests and Round 2 dev fixtures leak rows prefixed with
// "task-" (e.g. "task-80-final-verify") into agent_events / concept stats.
// They have no learning meaning — filter them out of every instructor-facing
// concept array before the UI sees them. Mirrors the same prefix check used
// by `isDebugEvent` in components/cross-agent/event-describer.ts.
function isDebugConceptId(conceptId: string | undefined): boolean {
  return typeof conceptId === "string" && conceptId.startsWith("task-");
}

export function parseInstructorInsights(raw: unknown): InstructorDashboard {
  if (!raw || typeof raw !== "object") return EMPTY_INSTRUCTOR_DATA;
  const obj = raw as RawInstructorInsights;

  const strugglesRaw = (obj.struggles_top5?.struggles ?? []).filter(
    (s) => !isDebugConceptId(s.concept_id)
  );
  const struggles: ReadonlyArray<StruggleLearner> = strugglesRaw.map((s) => {
    const attempts = s.attempts ?? 0;
    const correct = s.correct ?? 0;
    const conceptId = s.concept_id ?? "unknown";
    return {
      userId: `concept-${conceptId}`,
      // The insights endpoint reports concept-level struggle, not user-level.
      // We surface the concept as the struggling subject so the existing UI
      // (designed for "learners struggling with X") still reads naturally.
      displayName: humanizeConceptId(conceptId),
      courseTitle: "전체 과정",
      conceptId,
      conceptTitle: humanizeConceptId(conceptId),
      masteryLevel: typeof s.accuracy === "number" ? s.accuracy : 0,
      failedQuizzes: Math.max(0, attempts - correct),
      lastActiveAt: new Date().toISOString(),
    };
  });

  const gapsRaw = (obj.content_gaps?.gaps ?? []).filter(
    (g) => !isDebugConceptId(g.concept_id)
  );
  const contentGaps: ReadonlyArray<ContentGap> = gapsRaw.map((g) => {
    const conceptId = g.concept_id ?? "unknown";
    const questions = g.question_count ?? 0;
    const clips = g.clip_count ?? 0;
    return {
      conceptId,
      conceptTitle: humanizeConceptId(conceptId),
      courseTitle: "전체 과정",
      // We don't have an explicit mastery score for gaps; approximate it
      // from clip-coverage ratio so the badge stays meaningful.
      avgMastery:
        questions > 0 ? Math.min(1, clips / Math.max(1, questions)) : 0,
      affectedLearners: questions,
      suggestion: `질문 ${questions}건 · 보유 클립 ${clips}개. 보충 강의 또는 FAQ 클립 추가가 권장됩니다.`,
    };
  });

  const conceptsRaw = (obj.qa_stats?.concepts ?? []).filter(
    (c) => !isDebugConceptId(c.concept_id)
  );
  const qaSummary: ReadonlyArray<QASummary> = conceptsRaw.map((c, idx) => {
    const conceptId = c.concept_id ?? "unknown";
    const attempts = c.quiz_attempts ?? 0;
    const correctCount = c.quiz_correct ?? 0;
    const accuracyPct =
      attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;
    return {
      id: `qa-${conceptId}-${idx}`,
      question: `${humanizeConceptId(conceptId)} 관련 학습자 활동`,
      askedCount: c.qa_questions ?? 0,
      conceptId,
      suggestedAnswer:
        attempts > 0
          ? `퀴즈 ${attempts}회 시도 중 ${correctCount}회 정답 (정답률 ${accuracyPct}%). 누적 Q&A ${
              c.qa_questions ?? 0
            }건.`
          : `누적 Q&A ${c.qa_questions ?? 0}건. 아직 퀴즈 활동이 부족합니다.`,
    };
  });

  return { struggles, contentGaps, qaSummary };
}

interface RawDemandCategory {
  readonly category?: string;
  readonly course_count?: number;
  readonly recent_attempts?: number;
  readonly active_learners?: number;
  readonly demand_score?: number;
}

interface RawPlatformDemand {
  readonly categories?: ReadonlyArray<RawDemandCategory>;
}

interface RawTrendingItem {
  readonly topic?: string;
  readonly score?: number;
}

interface RawPromotion {
  readonly name?: string;
  readonly target_segment?: string;
  readonly offer?: string;
  readonly target_courses?: ReadonlyArray<string>;
  readonly rationale?: string;
}

interface RawPlatformRecommendations {
  readonly trends?: { readonly trending?: ReadonlyArray<RawTrendingItem> };
  // promotion_recommender returns LLM-generated JSON; the backend wraps it as
  // `{ promotions: [...] }` on success or `{ raw: "<text>" }` on parse failure.
  readonly promotions?:
    | { readonly promotions?: ReadonlyArray<RawPromotion> }
    | { readonly raw?: string };
}

export function parsePlatformDashboard(
  recRaw: unknown,
  demandRaw: unknown
): PlatformDashboard {
  return {
    demand: parsePlatformDemand(demandRaw),
    trends: parsePlatformTrends(recRaw),
    promotions: parsePlatformPromotions(recRaw),
  };
}

function parsePlatformDemand(raw: unknown): ReadonlyArray<DemandPoint> {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as RawPlatformDemand;
  const cats = obj.categories ?? [];
  return cats.map((c) => ({
    category: c.category ?? "(미지정)",
    // The demand endpoint exposes activity counts; we map them onto the
    // existing search/enroll axes so the bar chart still tells the same story.
    searchVolume: c.recent_attempts ?? 0,
    enrollVolume: c.active_learners ?? 0,
  }));
}

function parsePlatformTrends(raw: unknown): ReadonlyArray<TrendItem> {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as RawPlatformRecommendations;
  // Trends are keyed by `topic` (free-form concept id). Strip dev-artifact
  // rows so Platform Agent's "trending" list doesn't advertise `task-80-*`.
  const trending = (obj.trends?.trending ?? []).filter(
    (t) => !isDebugConceptId(t.topic)
  );
  return trending.map((t, idx) => {
    const topic = t.topic ?? `topic-${idx}`;
    return {
      id: `trend-${idx}-${topic}`,
      keyword: humanizeConceptId(topic),
      // We don't have a real weekly-growth percentage from the backend yet;
      // expose the activity score so the UI keeps showing relative momentum.
      weeklyGrowth: typeof t.score === "number" ? t.score : 0,
      relatedCourses: 0,
      source: "학습자 활동 / 퀴즈 로그",
    };
  });
}

function parsePlatformPromotions(
  raw: unknown
): ReadonlyArray<PromotionSuggestion> {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as RawPlatformRecommendations;
  const promosWrapper = obj.promotions;
  if (!promosWrapper || typeof promosWrapper !== "object") return [];
  if (!("promotions" in promosWrapper)) return [];
  const list = promosWrapper.promotions ?? [];
  return list.map((p, idx) => ({
    id: `promo-${idx}`,
    title: p.name ?? "(이름 미정)",
    targetSegment: p.target_segment ?? "전체",
    expectedLift: p.offer ?? "—",
    rationale: p.rationale ?? "",
  }));
}

function humanizeConceptId(conceptId: string): string {
  if (!conceptId) return "(미지정 개념)";
  return (
    conceptId
      .replace(/^concept[-_]?/i, "")
      .replace(/[-_]+/g, " ")
      .trim() || conceptId
  );
}

// ----------------------------------------------------------------------
// Cross-agent events polling
// ----------------------------------------------------------------------

export interface AgentEvent {
  readonly id: string;
  readonly agent_name: "learner" | "instructor" | "platform";
  readonly event_type: string;
  readonly payload: Record<string, unknown>;
  readonly created_at: string;
}

interface FetchEventsOptions {
  readonly since?: string;
  readonly forRole?: "learner" | "instructor" | "platform" | "all";
  readonly limit?: number;
}

/**
 * Poll the backend agent_events feed. Returns an empty array on any failure
 * so the caller (toast / activity feed) can render gracefully without
 * special-casing network errors on every poll tick.
 */
export async function fetchEvents(
  opts: FetchEventsOptions = {}
): Promise<ReadonlyArray<AgentEvent>> {
  if (USE_MOCK) return [];
  const params = new URLSearchParams();
  if (opts.since) params.set("since", opts.since);
  if (opts.forRole) params.set("for_role", opts.forRole);
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  try {
    const response = await fetch(
      `${API_BASE}/api/v1/events?${params.toString()}`
    );
    if (!response.ok) return [];
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) return [];
    return data as ReadonlyArray<AgentEvent>;
  } catch {
    return [];
  }
}

