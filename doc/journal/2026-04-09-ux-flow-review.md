# End-to-end UX 흐름 전면검토
- 날짜: 2026-04-09
- 참여: 사용자, Claude

## 타임라인

### 09:00 — 검토 시작: 랜딩 페이지 (`/`)

랜딩 페이지 코드를 열어 전체 진입점을 파악했다. 히어로 섹션에 "Clover" 브랜드명과 함께 3개 역할(Learner / Instructor / Platform)로 바로 분기되는 CTA가 있다. LMS 통합 데모 버튼도 랜딩에서 직접 접근 가능하다.

**발견 이슈:** 랜딩에서 `/chat`으로 바로 진입하는 경로가 없다. `/learner`를 통해야만 채팅에 도달할 수 있어서 Learner 신규 사용자가 채팅 기능을 인지하기까지 한 단계 더 필요하다.

**결정:** `/learner` 페이지가 채팅 탭과 학습 일정 탭을 묶는 허브 역할을 하므로 랜딩 → Learner 진입 흐름은 충분하다고 판단. 별도 `/chat` 직결 링크는 추가하지 않기로 했다.

---

### 09:30 — Learner 흐름 검토 (`/learner`, `/profile`, `/chat`)

`/learner` 페이지가 두 탭(채팅 · 학습 일정)으로 구성되어 있음을 확인. `useSearchParams`로 `?tab=schedule`을 받아 탭 상태를 URL에 동기화한다.

**프로필 온보딩 모달 흐름:**
- 처음 방문하는 미인증 사용자는 Supabase 인증 후 프로필 설정 모달이 뜬다.
- `profile-store`의 `isOnboarded` 상태가 `false`면 `OnboardingModal`이 오버레이로 표시된다.
- 프로필 저장 완료 시 스토어가 업데이트되고 모달이 닫히며 채팅으로 진행된다.

**`/profile` 페이지 확인:**
- 커리어 목표, 경험 수준(입문자 / 중급자 / 숙련자), 하루 가용 시간(15 / 30 / 60 / 120분), 최종 목표 4개 필드로 구성.
- 저장 시 `updateProfile` / `createProfile` API를 호출하고 결과를 `profile-store`에 미러링하여 채팅 페이지가 즉시 최신 프로필을 참조한다.

**이슈 발견:** `/dashboard` 라우트가 `/learner?tab=schedule`로 리다이렉트만 하고 실제 내용이 없었다. 과거에 독립 페이지로 존재하던 대시보드가 Learner 탭으로 통합된 흔적이다.
**결정:** `/dashboard`는 호환성을 위한 리다이렉트 셸로 유지. 사용자 노출 없이 북마크 지원용으로만 존재.

---

### 10:15 — 채팅 UX 검토 (`/chat`, `chat-container`, SSE 스트리밍)

`ChatContainer`가 SSE 스트림을 구독하면서 `token` / `tool_call` / `tool_result` / `done` 이벤트를 처리한다. 스트리밍 중 tool_call 이벤트가 발생하면 채팅창 내 인라인 카드로 표시된다.

**LMS 임베드 모드 지원:**
- URL에 `embedded=1`이 붙으면 `useEmbeddedMode`가 활성화되어 헤더/네비게이션이 숨겨진다.
- 상위 LMS 프레임이 `postMessage`로 `COURSE_CONTEXT_CHANGE`를 보내면 현재 수강 중인 강의 컨텍스트가 채팅에 자동 반영된다.
- `CLOVER_AUTO_SEND_MESSAGE` 이벤트로 LMS 가이드 박스가 "이 내용 질문하기" 버튼을 누르면 메시지가 자동 전송된다.

**이슈:** 비로그인 임베드 상태에서 `EmbeddedLoginGate` 컴포넌트가 표시되지만, 로그인 후 다시 LMS 컨텍스트 postMessage를 받지 못하는 경우가 있었다.
**결정:** iframe이 로그인 후 리마운트되면서 `onLoad` 핸들러가 다시 postMessage를 보내도록 구조를 유지. 실제 흐름에서 문제없음을 확인.

---

### 11:00 — Instructor / Platform 대시보드 검토

두 페이지 모두 동일한 구조를 따른다:
1. 로딩 중 `ProgressIndicator` (단계별 애니메이션 표시)
2. 로드 완료 후 데이터 카드 그리드 표시
3. 상단에 AI 어시스턴트 채팅 패널 항상 노출

**Instructor 페이지 (`/instructor`):**
- `StruggleList` (취약 개념 목록), `ContentGapCard` (콘텐츠 갭), `QASummary` (Q&A 요약) 3개 카드.
- 백엔드 연결 실패 시 `source: "mock"` 배너를 표시해 사용자가 데모 데이터임을 인지할 수 있다.
- LMS 강사센터로 이동하는 배너 링크가 페이지 상단에 있다.

**Platform 페이지 (`/platform`):**
- `DemandChart` (수요 차트), `TrendCard` (트렌드), `PromotionSuggestion` (프로모션 제안) 3개 카드.
- 동일한 mock/live 배너 패턴 적용.

**이슈:** Instructor → Platform 이동 동선이 명확하지 않았다. Instructor 페이지에서 "운영자센터 바로가기"를 찾으려면 LMS 임베드 뷰 안에서만 볼 수 있었다.
**결정:** Instructor 페이지 상단에 운영자센터 링크 배너 추가. 스탠드얼론 뷰에서도 Cross-Agent 연결 고리를 노출.

---

### 13:00 — LMS 통합 흐름 전체 검토 (`/lms`)

EduMall 가상 LMS의 주요 라우트:
- `/lms` — 홈 (강의 목록, 히어로 배너, Clover Teaser)
- `/lms/courses` — 전체 강의 목록
- `/lms/courses/[courseId]` — 강의 상세 (Clover 학습자 에이전트 임베드)
- `/lms/my-courses` — 내 강의
- `/lms/instructor-center` — 강사센터 (Instructor Agent iframe 임베드)
- `/lms/operator-center` — 운영자센터 (Platform Agent iframe 임베드)

**Cross-Agent 시나리오 흐름 확인:**
```
학습자(T+0s)  → 어려운 개념 질문 → 취약 개념 기록
강사(T+15s)   → struggling 집계 → 보충 클립 추천
운영자(T+30s) → 수요 분석 → 프로모션 제안
```

**이슈:** `/lms/courses/[courseId]` 체험 강의가 Python 기초(`course_id=550e8400-...440001`)에만 수강 데이터가 시드되어 있고 나머지 강의는 클립 스크립트가 비어있다. 다른 강의로 들어가면 Learner Agent가 빈 커리큘럼을 받아 응답 품질이 떨어진다.
**결정:** 랜딩의 "체험 강의 들어보기" 버튼과 instructor-center 데모를 모두 Python 기초 강의로 고정. 코드에 `DEMO_COURSE_ID` 상수로 명시.

---

### 14:30 — 인증 흐름 검토 (`/login`, `/signup`, `/auth`)

- Supabase Auth 기반 이메일/비밀번호 로그인.
- 미인증 사용자가 보호된 라우트(`/learner`, `/instructor`, `/platform`, `/dashboard`)에 접근하면 프록시(`proxy.ts`)가 `/login`으로 리다이렉트.
- 로그인/가입 완료 후 원래 요청했던 페이지로 돌아간다.

**이슈:** signup 후 이메일 인증이 필요한데 UI에 "인증 이메일을 확인하세요" 안내가 충분하지 않았다.
**결정:** signup 완료 페이지에 이메일 확인 안내 메시지를 강조하는 것을 향후 개선사항으로 기록.

---

### 15:30 — ModeSwitcher와 뷰 전환 검토

헤더의 `ModeSwitcher` 컴포넌트로 Learner / Instructor / Platform 뷰를 즉시 전환할 수 있다. 각 뷰로 이동 시 현재 로그인 상태가 유지된다.

**결정:** 뷰 전환 시 채팅 히스토리가 초기화되지 않도록 각 에이전트별 채팅 스토어를 분리 유지. 현재 구조에서 이미 올바르게 처리되고 있음을 확인.

---

## 핵심 결정사항

| # | 결정 | 근거 |
|---|------|------|
| 1 | `/dashboard` → `/learner?tab=schedule` 리다이렉트 유지 | 단일 진입점으로 Learner 탭 허브화, 코드 중복 제거 |
| 2 | 체험 강의를 Python 기초(`440001`)로 고정 | 다른 강의는 클립 스크립트 미시드, 빈 커리큘럼으로 AI 응답 품질 저하 방지 |
| 3 | 임베드 모드에서 postMessage 기반 컨텍스트 전달 | iframe sandbox 제약 내에서 LMS → Clover 컨텍스트 핸드오프 유일한 방법 |
| 4 | Instructor/Platform 페이지 상단에 Cross-Agent 이동 배너 추가 | 3-Agent 연결 고리를 스탠드얼론 뷰에서도 명시적으로 노출 |
| 5 | mock/live 데이터 배너를 amber/clover 색상으로 구분 | 백엔드 연결 상태를 사용자가 즉시 인지할 수 있도록 시각적 차별화 |

---

## 미해결 이슈

1. **signup 이메일 인증 안내 부족** — 가입 후 "인증 이메일을 확인하세요" 메시지가 충분히 강조되지 않는다. 사용자가 이메일을 확인하지 않고 로그인을 시도하면 에러만 표시된다.

2. **비Python 강의의 빈 커리큘럼** — 목록에 7개 강의가 있지만 실제로 Clover와 연동되는 강의는 1개(Python 기초)뿐이다. 사용자가 다른 강의를 클릭하면 AI 응답 품질이 현저히 떨어진다. 강의 카드에 "AI 튜터 지원" 배지를 추가하거나 해당 강의를 강조해야 한다.

3. **로그인 후 임베드 컨텍스트 재전송 타이밍** — `EmbeddedLoginGate`에서 로그인 완료 후 부모 프레임이 postMessage를 재전송하는 타이밍이 이상적이지 않다. 극히 드문 케이스지만 컨텍스트 없이 채팅이 시작될 수 있다.

4. **모바일 뷰 Learner 탭 스위처** — 좁은 화면에서 채팅 탭과 학습 일정 탭의 탭바가 잘릴 수 있다. 확인 필요.

---

## 다음 단계

1. **AI 튜터 지원 배지 추가** — LMS 강의 목록에서 클립 스크립트가 시드된 강의에 "🍀 AI 튜터 지원" 배지를 표시하여 사용자가 어떤 강의에서 Clover를 체험할 수 있는지 명확히 안내.

2. **signup 완료 페이지 개선** — 이메일 인증 안내를 카드 형식으로 눈에 띄게 표시. "인증 이메일이 발송되었습니다" 토스트 + 안내 카드 조합.

3. **Cross-Agent 데모 시나리오 가이드** — LMS 메인 페이지의 `DemoScenarioCard`에 3단계 시나리오(학습자 → 강사 → 운영자)를 스텝 형식으로 안내. 현재는 텍스트만 있어 직관성이 부족하다.

4. **추가 강의 시드 또는 빈 강의 숨김** — 클립 스크립트가 없는 강의를 목록에서 제거하거나 "준비 중" 상태로 표시하여 사용자 혼란 방지.
