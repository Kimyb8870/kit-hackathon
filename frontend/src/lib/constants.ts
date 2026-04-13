import type { Message, ToolLog } from "@/types/chat";
import type { Course } from "@/types/course";
import type { ForgettingCurvePoint, ReviewItem } from "@/types/dashboard";

export const MOCK_MESSAGES: ReadonlyArray<Message> = [
  // Onboarding scenario
  {
    id: "msg-1",
    role: "assistant",
    content:
      "안녕하세요! 저는 AI 튜터입니다. 먼저 학습 목표를 설정해볼까요? 어떤 분야에 관심이 있으신가요?",
  },
  {
    id: "msg-2",
    role: "user",
    content: "데이터 분석에 관심이 있어요. Python을 배우고 싶습니다.",
  },
  // Recommendation scenario
  {
    id: "msg-3",
    role: "assistant",
    content:
      '좋아요! Python 데이터 분석을 위한 학습 경로를 추천해드릴게요.\n\n1. **Python 기초** - 변수, 조건문, 반복문\n2. **Pandas 기초** - 데이터프레임, 시리즈\n3. **데이터 시각화** - Matplotlib, Seaborn\n\n"Python 기초" 과정부터 시작하시겠어요?',
  },
  // Q&A scenario
  {
    id: "msg-4",
    role: "user",
    content: "리스트 컴프리헨션이 뭔가요?",
  },
  {
    id: "msg-5",
    role: "assistant",
    content:
      "리스트 컴프리헨션은 Python에서 리스트를 간결하게 생성하는 방법입니다.\n\n```python\n# 일반 방법\nsquares = []\nfor x in range(10):\n    squares.append(x ** 2)\n\n# 리스트 컴프리헨션\nsquares = [x ** 2 for x in range(10)]\n```\n\n두 코드의 결과는 동일하지만, 리스트 컴프리헨션이 더 파이썬스럽고 읽기 쉽습니다.",
  },
  // Error correction scenario
  {
    id: "msg-6",
    role: "user",
    content: "퀴즈 2번 문제를 틀렸는데 왜 틀렸는지 모르겠어요.",
  },
  {
    id: "msg-7",
    role: "assistant",
    content:
      '2번 문제를 분석해볼게요.\n\n**문제:** `range(1, 5)`의 출력은?\n**당신의 답:** `[1, 2, 3, 4, 5]`\n**정답:** `[1, 2, 3, 4]`\n\n`range(start, stop)`에서 `stop`은 포함되지 않습니다. 이것은 Python의 "반열린 구간" 규칙입니다.\n\n이 개념을 복습 일정에 추가할까요?',
  },
];

export const MOCK_TOOL_LOGS: ReadonlyArray<ToolLog> = [
  {
    id: "mock-tool-1",
    tool: "profile_manager",
    input: { action: "get" },
    output: '{"status":"success","profile":{"level":"beginner"}}',
    status: "success",
    duration: 200,
    timestamp: Date.now() - 3000,
  },
  {
    id: "mock-tool-2",
    tool: "course_search",
    input: { query: "REST API" },
    output: '{"clips":3,"results":["API 기초","REST 설계","HTTP 메서드"]}',
    status: "success",
    duration: 1200,
    timestamp: Date.now() - 2000,
  },
  {
    id: "mock-tool-3",
    tool: "course_recommender",
    input: { user_id: "default-user", top_k: 3 },
    output: '{"recommendations":1,"course":"REST API 마스터"}',
    status: "success",
    duration: 800,
    timestamp: Date.now() - 1000,
  },
];

export const MOCK_COURSES: ReadonlyArray<Course> = [
  {
    id: "course-python-basics",
    title: "Python 기초: 프로그래밍 첫걸음",
    category: "프로그래밍",
    difficulty: "beginner",
    totalChapters: 12,
  },
  {
    id: "course-data-analysis",
    title: "Pandas로 배우는 데이터 분석",
    category: "데이터 분석",
    difficulty: "intermediate",
    totalChapters: 8,
  },
  {
    id: "course-web-dev",
    title: "JavaScript 웹 개발 입문",
    category: "웹 개발",
    difficulty: "beginner",
    totalChapters: 10,
  },
];

export const MOCK_FORGETTING_CURVE: ReadonlyArray<ForgettingCurvePoint> =
  Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    return {
      day,
      retentionWithReview: Math.max(
        60,
        100 - day * 0.8 + Math.sin(day * 0.5) * 5
      ),
      retentionWithout: Math.max(20, 100 * Math.exp(-day * 0.1)),
    };
  });

export const MOCK_REVIEW_SCHEDULE: ReadonlyArray<ReviewItem> = [
  {
    conceptId: "concept-list-comp",
    courseTitle: "Python 기초: 프로그래밍 첫걸음",
    clipReference: "Ch.3 Clip 2 - 리스트 컴프리헨션",
    masteryLevel: 0.65,
    nextReviewAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    conceptId: "concept-range",
    courseTitle: "Python 기초: 프로그래밍 첫걸음",
    clipReference: "Ch.2 Clip 5 - range 함수",
    masteryLevel: 0.45,
    nextReviewAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    conceptId: "concept-dict",
    courseTitle: "Python 기초: 프로그래밍 첫걸음",
    clipReference: "Ch.4 Clip 1 - 딕셔너리",
    masteryLevel: 0.8,
    nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    conceptId: "concept-dataframe",
    courseTitle: "Pandas로 배우는 데이터 분석",
    clipReference: "Ch.1 Clip 3 - DataFrame 생성",
    masteryLevel: 0.3,
    nextReviewAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  },
  {
    conceptId: "concept-series",
    courseTitle: "Pandas로 배우는 데이터 분석",
    clipReference: "Ch.1 Clip 1 - Series 기초",
    masteryLevel: 0.55,
    nextReviewAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  },
];

import type { StudyScheduleItem, WeeklyPlanDay } from "@/types/dashboard";

// UUIDs and (chapter_no, clip_no) tuples below are real seeded values from
// `src/backend/data/courses.json`. Display labels (`courseTitle` /
// `chapter` / `clip`) match the canonical catalog entries so the
// human-readable text and the machine fields refer to the SAME lecture
// clip — this lets the AI tutor's `get_current_clip` tool fetch the actual
// transcript and ground its answer instead of hallucinating from the
// title alone.
const COURSE_PYTHON_BASICS_ID = "550e8400-e29b-41d4-a716-446655440001";
// NOTE: 440005 (데이터 분석 입문) has zero rows in production `course_clips`,
// so `get_current_clip` returns null and the Clover Learner answer collapses
// into a hallucinated clip title. Until that course's transcripts are seeded,
// every mock schedule item must point at COURSE_PYTHON_BASICS_ID — the only
// course whose clips are currently populated end-to-end.

export const MOCK_TODAY_SCHEDULE: ReadonlyArray<StudyScheduleItem> = [
  {
    id: "schedule-1",
    type: "new",
    courseTitle: "Python 기초 완전 정복",
    chapter: "Ch.4",
    clip: "Clip 1 - 함수 정의와 호출",
    estimatedMinutes: 15,
    completed: false,
    courseId: COURSE_PYTHON_BASICS_ID,
    chapterNo: 4,
    clipNo: 1,
  },
  {
    id: "schedule-2",
    type: "review",
    courseTitle: "Python 기초 완전 정복",
    chapter: "Ch.3",
    clip: "Clip 1 - 리스트와 리스트 컴프리헨션",
    estimatedMinutes: 10,
    completed: true,
    courseId: COURSE_PYTHON_BASICS_ID,
    chapterNo: 3,
    clipNo: 1,
  },
  {
    id: "schedule-3",
    type: "quiz",
    courseTitle: "Python 기초 완전 정복",
    chapter: "Ch.2",
    clip: "Clip 2 - for 반복문",
    estimatedMinutes: 5,
    completed: false,
    courseId: COURSE_PYTHON_BASICS_ID,
    chapterNo: 2,
    clipNo: 2,
  },
  {
    id: "schedule-4",
    type: "review",
    courseTitle: "Python 기초 완전 정복",
    chapter: "Ch.5",
    clip: "Clip 1 - 클래스와 객체",
    estimatedMinutes: 10,
    completed: false,
    courseId: COURSE_PYTHON_BASICS_ID,
    chapterNo: 5,
    clipNo: 1,
  },
  {
    id: "schedule-5",
    type: "new",
    courseTitle: "Python 기초 완전 정복",
    chapter: "Ch.5",
    clip: "Clip 2 - 상속과 다형성",
    estimatedMinutes: 20,
    completed: true,
    courseId: COURSE_PYTHON_BASICS_ID,
    chapterNo: 5,
    clipNo: 2,
  },
];

function getWeekDates(): ReadonlyArray<WeeklyPlanDay> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

  const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
  const weeklyData = [
    { totalItems: 4, completedItems: 4 },
    { totalItems: 3, completedItems: 3 },
    { totalItems: 5, completedItems: 5 },
    { totalItems: 2, completedItems: 1 },
    { totalItems: 5, completedItems: 2 },
    { totalItems: 3, completedItems: 0 },
    { totalItems: 1, completedItems: 0 },
  ];

  return dayNames.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    const todayStr = `${now.getMonth() + 1}/${now.getDate()}`;
    return {
      day,
      date: dateStr,
      totalItems: weeklyData[i].totalItems,
      completedItems: weeklyData[i].completedItems,
      isToday: dateStr === todayStr,
    };
  });
}

export const MOCK_WEEKLY_PLAN: ReadonlyArray<WeeklyPlanDay> = getWeekDates();

import type { InstructorDashboard } from "@/types/instructor";
import type { PlatformDashboard } from "@/types/platform";

export const MOCK_INSTRUCTOR_DASHBOARD: InstructorDashboard = {
  struggles: [
    {
      userId: "user-103",
      displayName: "김민지",
      courseTitle: "Python 기초: 프로그래밍 첫걸음",
      conceptId: "concept-list-comp",
      conceptTitle: "리스트 컴프리헨션",
      masteryLevel: 0.32,
      failedQuizzes: 3,
      lastActiveAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      userId: "user-208",
      displayName: "박서준",
      courseTitle: "Python 기초: 프로그래밍 첫걸음",
      conceptId: "concept-range",
      conceptTitle: "range 함수와 반열린 구간",
      masteryLevel: 0.41,
      failedQuizzes: 2,
      lastActiveAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
      userId: "user-311",
      displayName: "이수아",
      courseTitle: "Pandas로 배우는 데이터 분석",
      conceptId: "concept-dataframe",
      conceptTitle: "DataFrame 인덱싱",
      masteryLevel: 0.28,
      failedQuizzes: 4,
      lastActiveAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      userId: "user-417",
      displayName: "정도윤",
      courseTitle: "Pandas로 배우는 데이터 분석",
      conceptId: "concept-series",
      conceptTitle: "Series와 Index",
      masteryLevel: 0.45,
      failedQuizzes: 2,
      lastActiveAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
  ],
  contentGaps: [
    {
      conceptId: "concept-list-comp",
      conceptTitle: "리스트 컴프리헨션",
      courseTitle: "Python 기초: 프로그래밍 첫걸음",
      avgMastery: 0.43,
      affectedLearners: 27,
      suggestion:
        "조건부 컴프리헨션 예제를 추가하고, 일반 for 루프와 비교 시각화 자료를 포함하면 좋습니다.",
    },
    {
      conceptId: "concept-dataframe",
      conceptTitle: "DataFrame 인덱싱 (loc/iloc)",
      courseTitle: "Pandas로 배우는 데이터 분석",
      avgMastery: 0.38,
      affectedLearners: 19,
      suggestion:
        "loc과 iloc 차이를 비교 표로 정리하고, 흔한 실수 사례 3가지를 별도 클립으로 분리하세요.",
    },
    {
      conceptId: "concept-async",
      conceptTitle: "async / await 흐름",
      courseTitle: "JavaScript 웹 개발 입문",
      avgMastery: 0.52,
      affectedLearners: 14,
      suggestion:
        "Promise 체이닝과 async/await의 동등 변환 예제를 단계별로 추가해주세요.",
    },
  ],
  qaSummary: [
    {
      id: "qa-1",
      question: "리스트 컴프리헨션에서 if-else를 함께 쓰려면 어떻게 하나요?",
      askedCount: 12,
      conceptId: "concept-list-comp",
      suggestedAnswer:
        "조건이 필터링이면 뒤에 if만, 값을 분기하려면 표현식 앞에 'a if cond else b' 형태로 작성합니다. 예: [x*2 if x>0 else 0 for x in nums]",
    },
    {
      id: "qa-2",
      question: "loc과 iloc 중 언제 무엇을 써야 하나요?",
      askedCount: 9,
      conceptId: "concept-dataframe",
      suggestedAnswer:
        "라벨 기반 접근(컬럼명/인덱스명)이면 loc, 위치 기반(0,1,2...)이면 iloc을 사용합니다. 슬라이싱 끝점 포함 여부도 다르니 주의하세요.",
    },
    {
      id: "qa-3",
      question: "range(1,5)는 왜 5를 포함하지 않나요?",
      askedCount: 7,
      conceptId: "concept-range",
      suggestedAnswer:
        "Python의 range는 '반열린 구간'을 따릅니다 — 시작은 포함, 끝은 제외. len(range(a,b)) == b-a 가 항상 성립하도록 설계된 것입니다.",
    },
  ],
};

export const MOCK_PLATFORM_DASHBOARD: PlatformDashboard = {
  demand: [
    { category: "Python", searchVolume: 1820, enrollVolume: 612 },
    { category: "데이터 분석", searchVolume: 1430, enrollVolume: 498 },
    { category: "AI / LLM", searchVolume: 1280, enrollVolume: 320 },
    { category: "프론트엔드", searchVolume: 980, enrollVolume: 412 },
    { category: "백엔드", searchVolume: 770, enrollVolume: 295 },
    { category: "DevOps", searchVolume: 540, enrollVolume: 180 },
  ],
  trends: [
    {
      id: "trend-1",
      keyword: "LangGraph 에이전트",
      weeklyGrowth: 38.4,
      relatedCourses: 2,
      source: "검색 로그 + 외부 트렌드",
    },
    {
      id: "trend-2",
      keyword: "Pandas 2.x 마이그레이션",
      weeklyGrowth: 21.7,
      relatedCourses: 5,
      source: "Q&A 빈도",
    },
    {
      id: "trend-3",
      keyword: "Next.js 16 App Router",
      weeklyGrowth: 17.2,
      relatedCourses: 3,
      source: "검색 로그",
    },
    {
      id: "trend-4",
      keyword: "RAG 평가 (RAGAS)",
      weeklyGrowth: 14.5,
      relatedCourses: 1,
      source: "외부 트렌드",
    },
  ],
  promotions: [
    {
      id: "promo-1",
      title: "AI / LLM 입문 번들 30% 할인",
      targetSegment: "Python 기초 수강 완료자",
      expectedLift: "+18% 전환",
      rationale:
        "Python 기초를 마친 학습자의 42%가 AI/LLM 카테고리를 검색하지만 실제 등록은 12%에 불과합니다. 입문 번들이 진입 장벽을 낮춥니다.",
    },
    {
      id: "promo-2",
      title: "신규 강의: LangGraph 실전 패턴",
      targetSegment: "백엔드 + AI 관심 학습자",
      expectedLift: "+24명 사전 등록",
      rationale:
        "LangGraph 검색량이 4주 연속 38% 성장 중이며 관련 강의는 2개뿐입니다. 빠른 신규 강의 출시 기회입니다.",
    },
    {
      id: "promo-3",
      title: "Pandas 마이그레이션 무료 워크숍",
      targetSegment: "Pandas 1.x 사용자",
      expectedLift: "리텐션 +9%",
      rationale:
        "Pandas 2.x 관련 Q&A가 급증 중. 무료 워크숍으로 리텐션과 브랜드 신뢰를 동시에 확보할 수 있습니다.",
    },
  ],
};
