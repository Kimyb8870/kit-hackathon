/**
 * Mock data for the EduMall sample LMS container.
 *
 * The Python course mirrors the canonical seed at
 * src/backend/data/courses.json so the embedded Clover Learner agent can
 * resolve the same courseId/chapterNo/clipNo coordinates from the iframe.
 *
 * Other courses are illustrative placeholders for the catalog grid.
 */

export interface LmsClip {
  clipNo: number;
  title: string;
  duration: string;
}

export interface LmsChapter {
  chapterNo: number;
  title: string;
  clips: LmsClip[];
}

export interface LmsCourse {
  id: string;
  title: string;
  category: LmsCategory;
  instructor: string;
  instructorTitle: string;
  thumbnailGradient: string;
  price: number;
  originalPrice?: number;
  totalHours: number;
  totalClips: number;
  rating: number;
  studentCount: number;
  level: "입문" | "초급" | "중급" | "고급";
  tagline: string;
  description: string;
  curriculum: LmsChapter[];
  reviews: LmsReview[];
  badges?: ("BEST" | "NEW" | "HOT")[];
}

export interface LmsReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
}

export type LmsCategory =
  | "코딩·IT"
  | "게임·웹툰"
  | "디자인·CG"
  | "뷰티·미용"
  | "쿠킹·베이킹"
  | "승무원·취업"
  | "어학"
  | "라이프스타일"
  | "빅테크 자격증";

export const LMS_CATEGORIES: LmsCategory[] = [
  "코딩·IT",
  "게임·웹툰",
  "디자인·CG",
  "뷰티·미용",
  "쿠킹·베이킹",
  "승무원·취업",
  "어학",
  "라이프스타일",
  "빅테크 자격증",
];

const PYTHON_COURSE_ID = "550e8400-e29b-41d4-a716-446655440001";
const BACKEND_INTRO_ID = "550e8400-e29b-41d4-a716-446655440002";
const BACKEND_PATTERNS_ID = "550e8400-e29b-41d4-a716-446655440003";
const PYTHON_ASYNC_ID = "550e8400-e29b-41d4-a716-446655440004";
const DATA_ANALYSIS_ID = "550e8400-e29b-41d4-a716-446655440005";
const LLM_APPS_ID = "550e8400-e29b-41d4-a716-446655440006";
const FRONTEND_BASICS_ID = "550e8400-e29b-41d4-a716-446655440007";

export const LMS_COURSES: LmsCourse[] = [
  {
    id: PYTHON_COURSE_ID,
    title: "Python 기초 완전 정복 — 변수부터 객체지향까지",
    category: "코딩·IT",
    instructor: "김파이썬",
    instructorTitle: "前 네이버 백엔드 엔지니어",
    thumbnailGradient: "from-zinc-700 via-zinc-600 to-zinc-800",
    price: 99000,
    originalPrice: 149000,
    totalHours: 18,
    totalClips: 16,
    rating: 4.9,
    studentCount: 12847,
    level: "입문",
    tagline: "현업 백엔드가 알려주는 진짜 파이썬, 16개 핵심 클립으로 끝내기",
    description:
      "단순 문법 암기가 아니라 '왜 이렇게 동작하는가'를 이해시키는 강의입니다. 변수의 본질, 스코프, 클래스의 메타 구조까지 — 입문자가 흔히 놓치는 디테일을 짚어드립니다.",
    badges: ["BEST", "HOT"],
    curriculum: [
      {
        chapterNo: 1,
        title: "Python 시작하기",
        clips: [
          { clipNo: 1, title: "Python이란 무엇인가?", duration: "08:30" },
          { clipNo: 2, title: "변수와 자료형", duration: "09:29" },
          { clipNo: 3, title: "입출력과 연산자", duration: "08:59" },
        ],
      },
      {
        chapterNo: 2,
        title: "제어 흐름",
        clips: [
          { clipNo: 1, title: "조건문 if-elif-else", duration: "10:00" },
          { clipNo: 2, title: "for 반복문", duration: "09:59" },
          { clipNo: 3, title: "while 반복문과 제어문", duration: "09:59" },
          { clipNo: 4, title: "예외 처리 try-except", duration: "09:59" },
        ],
      },
      {
        chapterNo: 3,
        title: "자료구조",
        clips: [
          { clipNo: 1, title: "리스트와 리스트 컴프리헨션", duration: "12:00" },
          { clipNo: 2, title: "튜플과 딕셔너리", duration: "11:59" },
          { clipNo: 3, title: "집합과 자료구조 선택", duration: "10:59" },
        ],
      },
      {
        chapterNo: 4,
        title: "함수",
        clips: [
          { clipNo: 1, title: "함수 정의와 호출", duration: "10:00" },
          { clipNo: 2, title: "스코프와 클로저", duration: "11:59" },
          { clipNo: 3, title: "람다와 고차 함수", duration: "09:59" },
        ],
      },
      {
        chapterNo: 5,
        title: "객체지향 프로그래밍",
        clips: [
          { clipNo: 1, title: "클래스와 객체", duration: "12:00" },
          { clipNo: 2, title: "상속과 다형성", duration: "11:59" },
          { clipNo: 3, title: "매직 메서드와 프로토콜", duration: "10:59" },
        ],
      },
    ],
    reviews: [
      {
        id: "r1",
        author: "초보개발자",
        rating: 5,
        date: "2026-03-22",
        body: "변수가 '상자'가 아니라 '이름표'라는 설명에서 무릎을 탁 쳤습니다. 클로저까지 자연스럽게 이어지는 흐름이 좋았어요.",
      },
      {
        id: "r2",
        author: "비전공자준비생",
        rating: 5,
        date: "2026-03-15",
        body: "강의 옆에 붙은 AI 튜터한테 실시간으로 질문하면서 들으니 진도가 2배는 빨라요. 확실히 다른 강의랑은 차원이 다릅니다.",
      },
      {
        id: "r3",
        author: "주니어개발자",
        rating: 4,
        date: "2026-03-08",
        body: "기초 강의지만 MRO나 매직 메서드까지 짚어줘서 복습용으로도 좋습니다.",
      },
    ],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440008",
    title: "리액트 실전 — 컴포넌트 설계부터 상태관리까지",
    category: "코딩·IT",
    instructor: "이리액트",
    instructorTitle: "토스 프론트엔드 리드",
    thumbnailGradient: "from-zinc-600 via-zinc-700 to-zinc-900",
    price: 129000,
    originalPrice: 198000,
    totalHours: 22,
    totalClips: 24,
    rating: 4.8,
    studentCount: 8431,
    level: "중급",
    tagline: "현업 프론트엔드의 컴포넌트 설계 노하우",
    description:
      "React 19 기준으로 컴포넌트 설계, 상태관리, 서버 컴포넌트, 폼 핸들링까지 실무에서 진짜 쓰는 패턴만 모았습니다.",
    badges: ["HOT"],
    curriculum: [
      {
        chapterNo: 1,
        title: "컴포넌트 설계 원칙",
        clips: [
          { clipNo: 1, title: "단일 책임 원칙과 컴포넌트", duration: "12:00" },
          { clipNo: 2, title: "Props 설계 가이드", duration: "10:00" },
        ],
      },
      {
        chapterNo: 2,
        title: "상태관리 전략",
        clips: [
          { clipNo: 1, title: "로컬 vs 글로벌 상태", duration: "11:00" },
          { clipNo: 2, title: "Zustand 실전", duration: "14:00" },
        ],
      },
    ],
    reviews: [
      {
        id: "r1",
        author: "프론트엔드준비생",
        rating: 5,
        date: "2026-03-20",
        body: "단순 React가 아니라 '설계'를 가르쳐줘서 좋습니다.",
      },
    ],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440009",
    title: "피그마 인터랙션 디자인 마스터클래스",
    category: "디자인·CG",
    instructor: "박디자인",
    instructorTitle: "카카오 UX 시니어",
    thumbnailGradient: "from-stone-600 via-stone-500 to-stone-700",
    price: 89000,
    originalPrice: 138000,
    totalHours: 14,
    totalClips: 18,
    rating: 4.7,
    studentCount: 5621,
    level: "초급",
    tagline: "Variants, Auto Layout, Prototyping까지 한번에",
    description:
      "피그마의 진짜 생산성을 끌어올리는 실전 워크플로우. 인터랙션 프로토타입까지 만들어봅니다.",
    badges: ["NEW"],
    curriculum: [
      {
        chapterNo: 1,
        title: "기초 다지기",
        clips: [
          { clipNo: 1, title: "Frame과 Auto Layout", duration: "10:00" },
        ],
      },
    ],
    reviews: [],
  },
  {
    id: "550e8400-e29b-41d4-a716-44665544000a",
    title: "집밥의 정석 — 한식 기본기 30가지",
    category: "쿠킹·베이킹",
    instructor: "최주방장",
    instructorTitle: "20년 경력 한식 셰프",
    thumbnailGradient: "from-neutral-500 via-neutral-600 to-neutral-700",
    price: 69000,
    originalPrice: 99000,
    totalHours: 12,
    totalClips: 30,
    rating: 4.9,
    studentCount: 9842,
    level: "입문",
    tagline: "30가지 메뉴로 일주일 식단 끝내기",
    description:
      "복잡한 비법 없이 진짜 집밥의 기본기. 계량부터 불 조절, 양념 비율까지.",
    badges: ["BEST"],
    curriculum: [
      {
        chapterNo: 1,
        title: "기본 양념과 계량",
        clips: [
          { clipNo: 1, title: "황금 양념 비율", duration: "08:00" },
        ],
      },
    ],
    reviews: [],
  },
  {
    id: "550e8400-e29b-41d4-a716-44665544000b",
    title: "비즈니스 영어 이메일 & 회의 영어",
    category: "어학",
    instructor: "Sarah Kim",
    instructorTitle: "前 골드만삭스 애널리스트",
    thumbnailGradient: "from-slate-600 via-slate-700 to-slate-800",
    price: 79000,
    originalPrice: 119000,
    totalHours: 10,
    totalClips: 22,
    rating: 4.6,
    studentCount: 3214,
    level: "중급",
    tagline: "외국계 회사에서 진짜 쓰이는 표현 모음",
    description:
      "교과서 영어가 아닌 실제 외국계 기업에서 통용되는 이메일 템플릿과 회의 표현을 배웁니다.",
    badges: ["NEW"],
    curriculum: [
      {
        chapterNo: 1,
        title: "이메일의 기본",
        clips: [
          { clipNo: 1, title: "오프닝과 클로징 표현", duration: "09:00" },
        ],
      },
    ],
    reviews: [],
  },
  {
    id: "550e8400-e29b-41d4-a716-44665544000c",
    title: "AWS SAA 자격증 한 번에 합격하기",
    category: "빅테크 자격증",
    instructor: "정클라우드",
    instructorTitle: "AWS Community Builder",
    thumbnailGradient: "from-zinc-500 via-zinc-600 to-zinc-800",
    price: 159000,
    originalPrice: 220000,
    totalHours: 28,
    totalClips: 42,
    rating: 4.8,
    studentCount: 6709,
    level: "중급",
    tagline: "실전 모의고사 5세트 포함",
    description:
      "AWS SAA-C03 시험 출제 패턴 분석 기반으로 핵심만 짚어드립니다.",
    badges: ["HOT"],
    curriculum: [
      {
        chapterNo: 1,
        title: "AWS 기초",
        clips: [
          { clipNo: 1, title: "리전과 가용영역", duration: "10:00" },
        ],
      },
    ],
    reviews: [],
  },
  {
    id: "550e8400-e29b-41d4-a716-44665544000d",
    title: "유니티로 만드는 첫 모바일 게임",
    category: "게임·웹툰",
    instructor: "강게임",
    instructorTitle: "스마일게이트 前 시니어",
    thumbnailGradient: "from-stone-700 via-stone-800 to-zinc-900",
    price: 119000,
    originalPrice: 169000,
    totalHours: 20,
    totalClips: 28,
    rating: 4.7,
    studentCount: 4123,
    level: "초급",
    tagline: "기획부터 출시까지 풀 사이클",
    description:
      "Unity 6 기준 모바일 캐주얼 게임 한 편을 처음부터 끝까지 함께 만들어봅니다.",
    curriculum: [
      {
        chapterNo: 1,
        title: "기획과 프로토타이핑",
        clips: [
          { clipNo: 1, title: "게임 컨셉 잡기", duration: "12:00" },
        ],
      },
    ],
    reviews: [],
  },
  {
    id: "550e8400-e29b-41d4-a716-44665544000e",
    title: "데일리 메이크업 클래스",
    category: "뷰티·미용",
    instructor: "한뷰티",
    instructorTitle: "10년차 메이크업 아티스트",
    thumbnailGradient: "from-neutral-600 via-neutral-700 to-neutral-800",
    price: 59000,
    totalHours: 8,
    totalClips: 16,
    rating: 4.8,
    studentCount: 7821,
    level: "입문",
    tagline: "출근 10분 메이크업 루틴",
    description:
      "베이스부터 아이, 립까지. 바쁜 아침을 위한 미니멀 메이크업.",
    badges: ["BEST"],
    curriculum: [
      {
        chapterNo: 1,
        title: "베이스 메이크업",
        clips: [{ clipNo: 1, title: "스킨 톤 보정", duration: "07:00" }],
      },
    ],
    reviews: [],
  },
  {
    id: BACKEND_INTRO_ID,
    title: "백엔드 개발 입문 — 서버와 데이터베이스",
    category: "코딩·IT",
    instructor: "서버마스터",
    instructorTitle: "Clover Academy 백엔드 트랙",
    thumbnailGradient: "from-slate-700 via-slate-600 to-zinc-700",
    price: 89000,
    originalPrice: 129000,
    totalHours: 12,
    totalClips: 12,
    rating: 4.7,
    studentCount: 4280,
    level: "입문",
    tagline: "HTTP부터 FastAPI, DB, REST API까지 — 백엔드의 전체 그림",
    description:
      "처음 서버를 만들어보는 분을 위한 강의입니다. 요청과 응답이 무엇인지부터 시작해서 FastAPI로 엔드포인트를 만들고, 관계형 DB를 설계해 CRUD API로 연결하는 흐름을 따라갑니다.",
    badges: ["NEW"],
    curriculum: [
      {
        chapterNo: 1,
        title: "웹 서버 기초",
        clips: [
          { clipNo: 1, title: "HTTP 프로토콜 개요", duration: "09:00" },
          { clipNo: 2, title: "요청과 응답의 구조", duration: "09:00" },
          { clipNo: 3, title: "상태 코드와 HTTP 메서드", duration: "09:00" },
        ],
      },
      {
        chapterNo: 2,
        title: "FastAPI 시작하기",
        clips: [
          { clipNo: 1, title: "FastAPI 프로젝트 구조", duration: "10:00" },
          { clipNo: 2, title: "라우팅과 경로 매개변수", duration: "10:00" },
          { clipNo: 3, title: "Pydantic 모델로 입력 검증", duration: "10:00" },
        ],
      },
      {
        chapterNo: 3,
        title: "데이터베이스 기본",
        clips: [
          { clipNo: 1, title: "관계형 데이터베이스 개념", duration: "09:30" },
          { clipNo: 2, title: "SQL 기본 쿼리", duration: "10:30" },
          { clipNo: 3, title: "SQLAlchemy ORM 입문", duration: "11:00" },
        ],
      },
      {
        chapterNo: 4,
        title: "REST API 설계",
        clips: [
          { clipNo: 1, title: "REST 원칙과 자원 모델링", duration: "10:30" },
          { clipNo: 2, title: "CRUD 엔드포인트 구현", duration: "11:30" },
          { clipNo: 3, title: "기본 인증과 토큰", duration: "11:00" },
        ],
      },
    ],
    reviews: [
      {
        id: "r1",
        author: "백엔드입문자",
        rating: 5,
        date: "2026-03-28",
        body: "HTTP가 왜 필요한지부터 차근차근 설명해줘서 막막함이 사라졌어요. FastAPI 튜토리얼만 보다 포기했던 분들께 추천합니다.",
      },
    ],
  },
  {
    id: BACKEND_PATTERNS_ID,
    title: "실무 백엔드 패턴 — 서비스 레이어와 도메인",
    category: "코딩·IT",
    instructor: "아키서버",
    instructorTitle: "Clover Academy 아키텍처 트랙",
    thumbnailGradient: "from-zinc-800 via-slate-700 to-zinc-700",
    price: 139000,
    originalPrice: 198000,
    totalHours: 14,
    totalClips: 12,
    rating: 4.8,
    studentCount: 2340,
    level: "중급",
    tagline: "레이어드 아키텍처 · 리포지토리 · 서비스 레이어 실전 패턴",
    description:
      "FastAPI나 Django로 CRUD는 만들어봤지만 코드가 점점 엉키는 분들을 위한 강의입니다. 레이어를 나누는 이유, 리포지토리 패턴으로 DB를 분리하는 법, 트랜잭션 경계를 명확히 잡는 법까지 실무 패턴을 다룹니다.",
    badges: ["HOT"],
    curriculum: [
      {
        chapterNo: 1,
        title: "레이어드 아키텍처",
        clips: [
          { clipNo: 1, title: "왜 레이어를 나누는가", duration: "09:00" },
          { clipNo: 2, title: "프레젠테이션-서비스-리포지토리", duration: "10:00" },
          { clipNo: 3, title: "의존성 방향과 안정성", duration: "09:00" },
        ],
      },
      {
        chapterNo: 2,
        title: "리포지토리 패턴",
        clips: [
          { clipNo: 1, title: "리포지토리의 역할", duration: "09:30" },
          { clipNo: 2, title: "인터페이스와 구현 분리", duration: "10:00" },
          { clipNo: 3, title: "단위 테스트와 모킹", duration: "09:30" },
        ],
      },
      {
        chapterNo: 3,
        title: "서비스 레이어 설계",
        clips: [
          { clipNo: 1, title: "비즈니스 로직의 위치", duration: "10:00" },
          { clipNo: 2, title: "트랜잭션 스크립트와 도메인 모델", duration: "11:00" },
          { clipNo: 3, title: "유스케이스 모델링", duration: "10:00" },
        ],
      },
      {
        chapterNo: 4,
        title: "에러 처리와 트랜잭션",
        clips: [
          { clipNo: 1, title: "도메인 예외 설계", duration: "10:00" },
          { clipNo: 2, title: "트랜잭션 경계 정의", duration: "10:30" },
          { clipNo: 3, title: "재시도와 보상 트랜잭션", duration: "10:30" },
        ],
      },
    ],
    reviews: [
      {
        id: "r1",
        author: "주니어서버",
        rating: 5,
        date: "2026-03-25",
        body: "'레이어를 왜 나눠야 하는지'에 대한 설명이 막연한 권고가 아니라 실제 통증 위주라서 바로 이해됐습니다.",
      },
    ],
  },
  {
    id: PYTHON_ASYNC_ID,
    title: "고급 Python — 비동기와 동시성",
    category: "코딩·IT",
    instructor: "코루틴",
    instructorTitle: "Clover Academy 파이썬 트랙",
    thumbnailGradient: "from-slate-800 via-zinc-800 to-neutral-800",
    price: 149000,
    originalPrice: 209000,
    totalHours: 13,
    totalClips: 12,
    rating: 4.9,
    studentCount: 1870,
    level: "고급",
    tagline: "제너레이터 · asyncio · async/await · 동시성 제어",
    description:
      "이벤트 루프가 어떻게 동작하는지, async/await가 내부적으로 무엇을 하는지 원리부터 파고드는 강의입니다. 웹 크롤러, API 호출 파이프라인 등 실전 예제로 gather, Semaphore, 취소와 타임아웃까지 다룹니다.",
    badges: ["HOT", "NEW"],
    curriculum: [
      {
        chapterNo: 1,
        title: "제너레이터와 이터레이터 심화",
        clips: [
          { clipNo: 1, title: "이터레이터 프로토콜", duration: "09:30" },
          { clipNo: 2, title: "제너레이터와 yield", duration: "10:00" },
          { clipNo: 3, title: "yield from과 위임", duration: "09:30" },
        ],
      },
      {
        chapterNo: 2,
        title: "asyncio 기본",
        clips: [
          { clipNo: 1, title: "이벤트 루프 개념", duration: "10:00" },
          { clipNo: 2, title: "코루틴과 task", duration: "10:30" },
          { clipNo: 3, title: "asyncio.run과 생명주기", duration: "09:30" },
        ],
      },
      {
        chapterNo: 3,
        title: "async/await 패턴",
        clips: [
          { clipNo: 1, title: "await의 진짜 동작", duration: "10:00" },
          { clipNo: 2, title: "gather와 wait", duration: "10:00" },
          { clipNo: 3, title: "async context manager", duration: "10:00" },
        ],
      },
      {
        chapterNo: 4,
        title: "동시성 제어",
        clips: [
          { clipNo: 1, title: "Lock과 Semaphore", duration: "10:00" },
          { clipNo: 2, title: "Queue와 생산자-소비자", duration: "10:00" },
          { clipNo: 3, title: "취소와 타임아웃", duration: "10:00" },
        ],
      },
    ],
    reviews: [
      {
        id: "r1",
        author: "시니어파이썬",
        rating: 5,
        date: "2026-03-29",
        body: "이벤트 루프 동작 원리를 이렇게 직관적으로 설명한 강의는 처음입니다. await 챕터가 특히 명료해요.",
      },
    ],
  },
  {
    id: DATA_ANALYSIS_ID,
    title: "데이터 분석 입문 — pandas와 시각화",
    category: "코딩·IT",
    instructor: "데이터판다",
    instructorTitle: "Clover Academy 데이터 트랙",
    thumbnailGradient: "from-neutral-700 via-zinc-700 to-stone-700",
    price: 99000,
    originalPrice: 139000,
    totalHours: 11,
    totalClips: 12,
    rating: 4.6,
    studentCount: 3650,
    level: "입문",
    tagline: "NumPy · pandas · matplotlib — 데이터 분석의 첫걸음",
    description:
      "엑셀 대신 코드로 데이터를 다뤄보고 싶은 분을 위한 강의입니다. NumPy 벡터 연산부터 pandas DataFrame 조작, 결측치 처리, matplotlib 기본 차트까지 손에 잡히는 예제로 실습합니다.",
    badges: ["NEW"],
    curriculum: [
      {
        chapterNo: 1,
        title: "NumPy 기초",
        clips: [
          { clipNo: 1, title: "ndarray 객체 이해", duration: "09:00" },
          { clipNo: 2, title: "벡터 연산과 브로드캐스팅", duration: "10:00" },
          { clipNo: 3, title: "인덱싱과 슬라이싱", duration: "09:00" },
        ],
      },
      {
        chapterNo: 2,
        title: "pandas DataFrame",
        clips: [
          { clipNo: 1, title: "Series와 DataFrame", duration: "09:30" },
          { clipNo: 2, title: "행과 열 선택하기", duration: "10:30" },
          { clipNo: 3, title: "groupby와 집계", duration: "10:00" },
        ],
      },
      {
        chapterNo: 3,
        title: "데이터 정제",
        clips: [
          { clipNo: 1, title: "결측치 처리", duration: "09:00" },
          { clipNo: 2, title: "중복 제거와 타입 변환", duration: "09:00" },
          { clipNo: 3, title: "병합과 조인", duration: "10:00" },
        ],
      },
      {
        chapterNo: 4,
        title: "matplotlib 시각화",
        clips: [
          { clipNo: 1, title: "Figure와 Axes 구조", duration: "09:00" },
          { clipNo: 2, title: "기본 차트 그리기", duration: "10:00" },
          { clipNo: 3, title: "스타일과 레이블", duration: "09:00" },
        ],
      },
    ],
    reviews: [
      {
        id: "r1",
        author: "데이터입문",
        rating: 5,
        date: "2026-03-18",
        body: "엑셀만 쓰던 저도 DataFrame 조작이 자연스럽게 손에 익었어요. groupby 챕터가 특히 인상 깊었습니다.",
      },
    ],
  },
  {
    id: LLM_APPS_ID,
    title: "LLM 애플리케이션 구축 — RAG와 에이전트",
    category: "코딩·IT",
    instructor: "에이전트설계자",
    instructorTitle: "Clover Academy AI 트랙",
    thumbnailGradient: "from-zinc-700 via-neutral-700 to-stone-800",
    price: 179000,
    originalPrice: 249000,
    totalHours: 14,
    totalClips: 12,
    rating: 4.9,
    studentCount: 2980,
    level: "고급",
    tagline: "임베딩 · 벡터 DB · RAG · LangChain · 에이전트 오케스트레이션",
    description:
      "LLM API 호출은 해봤지만 진짜 앱은 어떻게 만드는지 궁금한 분을 위한 강의입니다. 토큰과 컨텍스트 개념부터 벡터 검색, RAG 파이프라인, 도구 호출, 에이전트 상태 관리까지 실제 배포 가능한 수준의 구조를 다룹니다.",
    badges: ["HOT", "NEW"],
    curriculum: [
      {
        chapterNo: 1,
        title: "LLM 기초와 프롬프트 엔지니어링",
        clips: [
          { clipNo: 1, title: "대규모 언어 모델 개념", duration: "10:00" },
          { clipNo: 2, title: "토큰과 컨텍스트 윈도우", duration: "10:00" },
          { clipNo: 3, title: "프롬프트 구성 요소", duration: "10:00" },
        ],
      },
      {
        chapterNo: 2,
        title: "벡터 검색과 RAG 구조",
        clips: [
          { clipNo: 1, title: "임베딩과 의미 검색", duration: "10:30" },
          { clipNo: 2, title: "벡터 데이터베이스 선택", duration: "10:00" },
          { clipNo: 3, title: "RAG 파이프라인 구성", duration: "10:30" },
        ],
      },
      {
        chapterNo: 3,
        title: "LangChain과 도구 호출",
        clips: [
          { clipNo: 1, title: "LangChain 기본 컴포넌트", duration: "10:00" },
          { clipNo: 2, title: "도구와 함수 호출", duration: "10:30" },
          { clipNo: 3, title: "체인 구성과 LCEL", duration: "09:30" },
        ],
      },
      {
        chapterNo: 4,
        title: "에이전트와 오케스트레이션",
        clips: [
          { clipNo: 1, title: "ReAct 패턴", duration: "10:30" },
          { clipNo: 2, title: "에이전트 상태 관리", duration: "10:30" },
          { clipNo: 3, title: "다중 에이전트 조율", duration: "10:00" },
        ],
      },
    ],
    reviews: [
      {
        id: "r1",
        author: "AI엔지니어",
        rating: 5,
        date: "2026-04-01",
        body: "RAG를 단순 튜토리얼 수준이 아니라 '왜 이런 구조여야 하는가' 중심으로 설명해줘서 실무 결정에 바로 도움이 됐어요.",
      },
    ],
  },
  {
    id: FRONTEND_BASICS_ID,
    title: "프론트엔드 기초 — HTML, CSS, JavaScript",
    category: "코딩·IT",
    instructor: "웹입문",
    instructorTitle: "Clover Academy 프론트엔드 트랙",
    thumbnailGradient: "from-stone-600 via-zinc-600 to-slate-700",
    price: 79000,
    originalPrice: 119000,
    totalHours: 12,
    totalClips: 12,
    rating: 4.7,
    studentCount: 5120,
    level: "입문",
    tagline: "시맨틱 HTML · CSS 레이아웃 · JavaScript · DOM 조작",
    description:
      "웹 페이지가 어떻게 동작하는지 바닥부터 이해하는 강의입니다. HTML 시맨틱 태그, CSS 박스 모델과 Flex/Grid, JavaScript 문법, DOM과 이벤트 위임까지 — 이후 React 같은 프레임워크로 넘어갈 때 흔들리지 않을 기초를 다집니다.",
    badges: ["BEST"],
    curriculum: [
      {
        chapterNo: 1,
        title: "HTML 구조",
        clips: [
          { clipNo: 1, title: "문서 구조와 시맨틱 태그", duration: "09:00" },
          { clipNo: 2, title: "속성과 폼 요소", duration: "09:00" },
          { clipNo: 3, title: "접근성 기초", duration: "09:00" },
        ],
      },
      {
        chapterNo: 2,
        title: "CSS 레이아웃",
        clips: [
          { clipNo: 1, title: "선택자와 우선순위", duration: "10:00" },
          { clipNo: 2, title: "박스 모델", duration: "09:00" },
          { clipNo: 3, title: "Flexbox와 Grid", duration: "11:00" },
        ],
      },
      {
        chapterNo: 3,
        title: "JavaScript 기본",
        clips: [
          { clipNo: 1, title: "변수와 타입", duration: "09:30" },
          { clipNo: 2, title: "함수와 화살표 함수", duration: "10:00" },
          { clipNo: 3, title: "배열과 객체", duration: "09:30" },
        ],
      },
      {
        chapterNo: 4,
        title: "DOM 조작",
        clips: [
          { clipNo: 1, title: "DOM 선택과 이벤트", duration: "10:00" },
          { clipNo: 2, title: "요소 생성과 수정", duration: "10:00" },
          { clipNo: 3, title: "이벤트 위임", duration: "10:00" },
        ],
      },
    ],
    reviews: [
      {
        id: "r1",
        author: "프론트입문",
        rating: 5,
        date: "2026-03-20",
        body: "DOM 조작이 왜 비싼지, 이벤트 위임이 왜 필요한지를 코드 예제로 바로 보여줘서 뒷장의 React까지 자연스럽게 연결됐어요.",
      },
    ],
  },
];

export function getCourseById(id: string): LmsCourse | undefined {
  return LMS_COURSES.find((c) => c.id === id);
}

export function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR");
}

export function getCoursesByCategory(category: LmsCategory): LmsCourse[] {
  return LMS_COURSES.filter((c) => c.category === category);
}

export const FEATURED_HOT = LMS_COURSES.filter((c) =>
  c.badges?.includes("HOT")
);
export const FEATURED_PRACTICAL = LMS_COURSES.filter((c) =>
  c.badges?.includes("BEST")
);
export const FEATURED_NEW = LMS_COURSES.filter((c) => c.badges?.includes("NEW"));
