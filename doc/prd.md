# PRD: Clover 🍀 — 3-Agent Education Orchestrator

> **공모전:** KIT 바이브코딩 공모전 2026 — AI활용 차세대 교육 솔루션
> **주최:** KEG (한국교육그룹)
> **제출 기한:** 2026-04-13
> **문서 버전:** v3.0 (전면 리라이트)
> **작성일:** 2026-04-07
> **프로젝트 코드네임:** Clover
> **슬로건:** 교육에 행운을, 모두에게 — *Luck for Learning, for Everyone*

---

## 목차

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution: 3-Agent Orchestration](#3-solution-3-agent-orchestration)
4. [Architecture](#4-architecture)
5. [Sample LMS Container](#5-sample-lms-container)
6. [Demo Scenario](#6-demo-scenario)
7. [Tech Stack](#7-tech-stack)
8. [Differentiators](#8-differentiators)
9. [Roadmap](#9-roadmap)
10. [Risks & Mitigations](#10-risks--mitigations)

---

## 1. Executive Summary

### Clover 한 줄 정의

> **Clover는 어떤 LMS에든 임베딩 가능한 3-Agent 교육 오케스트레이터다.** 학습자(Learner) · 강사(Instructor) · 운영자(Platform), 세 주체를 위한 전문 AI 에이전트가 같은 데이터 위에서 협업하며 교육 생태계 전체를 최적화한다.

### 이름과 컨셉

`Clover` 🍀 = 행운(luck) + 네잎클로버(연결된 잎사귀들). 네 잎은 서로 다른 모양이지만 한 줄기에서 자란다. Clover의 세 에이전트도 마찬가지다 — 역할은 다르지만 **하나의 데이터 줄기**에서 자라며, 한 에이전트의 활동이 다른 에이전트의 통찰이 된다.

| 구분 | 단일 AI 튜터 시장 | **Clover** |
|------|----------------|-----------|
| 시점 | 학습자 1명만 본다 | **3 주체를 동시에 본다** |
| 데이터 흐름 | 학습자 → AI → 학습자 (폐쇄 루프) | **Learner → Instructor → Platform → Learner (선순환 루프)** |
| 비즈니스 모델 | B2C 단일 제품 | **B2B 임베딩형 오케스트레이터** (LMS-agnostic) |
| AI 구조 | Single ReAct Agent | **Multi-Agent Graph + Cross-Agent Data Bus** |
| 가치 제안 | "내 학습이 잘 된다" | "학습이 잘 되니까, 강의가 좋아지고, 비즈니스가 자란다" |

### 차별점 한 문장

> 학습자의 오답 하나가 강사의 콘텐츠 갭이 되고, 강사의 갭이 운영자의 신규 강의 의사결정이 된다. Clover는 이 데이터 흐름을 자동화한 **교육 생태계 OS**다.

### 데모 무대

Clover는 데모를 위해 따즈아 스타일의 **샘플 LMS 컨테이너**에 임베딩되어 시연된다. 컨테이너는 무대일 뿐, Clover는 어떤 LMS에든 동일하게 동작하도록 설계된다.

---

## 2. Problem Statement

### 2-1. 시장 데이터 — 4개 플랫폼 공통 페인포인트

> 출처: `doc/painpoint-research.md` (인프런 / 패스트캠퍼스 / Udemy / KEG·따즈아 4개 플랫폼 공개 리뷰·잡플래닛·Trustpilot·언론 보도 분석)

| # | 페인포인트 | 인프런 | 패캠 | Udemy | KEG | 영향 주체 |
|---|-----------|:------:|:----:|:-----:|:---:|:--------:|
| 1 | 콘텐츠 품질 편차 — 구매 전 예측 불가 | ✅ | ✅ | ✅ | ✅ | 학습자·운영자 |
| 2 | 강사 응답 지연 / 무응답 (수 주 방치) | ✅ | ✅ | ✅ | ✅ | 학습자·강사 |
| 3 | 개인화 학습 경로 부재 | ✅ | ✅ | ✅ | ✅ | 학습자 |
| 4 | 멘토링 / 코드리뷰 전무 | ✅ | ✅ | ✅ | ✅ | 학습자·강사 |
| 5 | 수료증 실질 가치 없음 (포트폴리오 연계 X) | ✅ | ✅ | ✅ | ✅ | 학습자 |
| 6 | 학습 참여도 유지 어려움 (완강률 3~15%) | ✅ | ✅ | ✅ | ✅ | 학습자·운영자 |

**핵심 데이터:**
- MOOC 평균 완강률: **3~15%** (MIT/Harvard 연구), K-MOOC 7~12% (KEDI)
- 즉시 피드백 효과 크기 **d=0.73** (Hattie & Timperley 2007) — 교육 개입 중 상위 10%
- Ebbinghaus 망각 곡선: 학습 1시간 후 56% 망각, 간격 반복으로 기억 유지율 **150~200%** 향상 (Cepeda 2006)
- 잡플래닛 평점: KEG 2.6/5, SBS아카데미 2.6/5, 올댓뷰티 2.2/5
- 패스트캠퍼스 미니 프로젝트 피드백 **2주+** 지연 사례 다수
- Udemy 신뢰도 위기: AI 챗봇 "Alex"만 운영, Trustpilot **1.9/5**, 허위 할인 집단소송 **$400만** 합의

### 2-2. 3 주체별 페인포인트 (Clover의 시작점)

기존 솔루션들은 **학습자만** 본다. 그러나 교육 플랫폼은 본질적으로 3 주체로 구성된 시스템이다.

```
       [학습자]              [강사]              [운영자]
          │                    │                    │
   "내가 잘 하고 있나?"  "학생들 어디서 막혀?"  "어떤 강의를 만들까?"
          │                    │                    │
          └────── 모두 답을 갖지 못한 채로 ──────────┘
                    각자의 어둠 속에서 고립
```

#### Learner (학습자) Pain
- 강사 답변을 며칠씩 기다린다 (CP-02)
- 자신이 잘 하고 있는지 알 길이 없다 (CP-08, 임포스터 신드롬: 개발자 58% 경험)
- 코드 리뷰가 없어 실력이 정체된다 (CP-05)
- 수료증을 받아도 채용시장에서 인정받지 못한다 (CP-07)

#### Instructor (강사) Pain
- 같은 질문을 100명에게 반복 답변해야 한다 (Q&A 공급-수요 미스매치)
- 학생들이 어디서 막히는지 데이터가 없다 → "감"으로 콘텐츠 보완
- 강사 처우 열악 (KEG 강사 월 190만원 사례) → 우수 강사 이탈
- 신규 콘텐츠 기획에 학습자 needs 데이터 없이 의사결정

#### Platform (운영자) Pain
- 어떤 강의를 만들어야 팔릴지 모른다 (수요 데이터 부재)
- 트렌드가 6개월~1년마다 바뀌는데 의사결정은 분기 단위
- 프로모션을 누구에게 보낼지 모른다 → 일괄 발송 → 피로도 증가
- 잡플래닛 2점대 평점이 누적되어 브랜드 신뢰도 하락

### 2-3. 본질 — 데이터는 있는데 흐르지 않는다

세 주체의 페인포인트는 **모두 같은 데이터에서 나온다.** 학습자의 오답, 학습자의 질문, 학습자의 학습시간. 이 데이터는 LMS 어딘가에 이미 쌓이고 있다. 그러나 그 데이터는 학습자 본인의 대시보드에서 끝난다. 강사에게도, 운영자에게도 흐르지 않는다.

> **Clover의 통찰:** 문제는 데이터 부재가 아니라 데이터 흐름의 단절이다. 단일 AI 튜터는 이 흐름을 만들 수 없다. **각 주체를 위한 전문 에이전트가 같은 데이터 버스 위에서 협업**해야 한다.

---

## 3. Solution: 3-Agent Orchestration

### 3-1. 한 줄 요약

> Clover는 **세 개의 전문 AI 에이전트**가 **하나의 공유 데이터 버스** 위에서 협업하는 LangGraph multi-agent 시스템이다.

### 3-2. 3 Agents

#### 🌱 Learner Agent — 학습 성공을 위한 전담 코치

**대상:** 수강생
**목적:** 학습자의 학습 성공률을 끌어올린다 (완강률, 실력 향상, 만족도)
**페르소나:** "옆자리에서 같이 코딩해주는 선배" — 친근하고 즉시 응답

**Tools:**

| Tool | 역할 | 핵심 가치 |
|------|------|---------|
| `profile_manager` | 학습자 프로필 CRUD (직무 목표, 가용 시간, 경험 수준) | 모든 추천의 근거 |
| `course_search` (RAG) | 강의 콘텐츠를 영상 클립 단위로 검색 (timestamp + concept_id) | "4-3강 15:20에서 설명합니다" 정확도 |
| `course_recommender` | 프로필 + 검색 결합 맞춤 학습 경로 추천 | 카테고리/인기순이 아닌 진짜 개인화 |
| `quiz_generator` | 수강 직후 즉석 미니퀴즈 생성 | 능동 학습 (Freeman 2014: 시험 점수 6% 향상) |
| `review_scheduler` | SM-2 기반 적응형 복습 스케줄링 (정답률·응답시간 가중) | Ebbinghaus 망각 극복 |
| `code_reviewer` | 커리큘럼 단계 인식 코드 리뷰 | 시장에 없는 차별점 |

**가드레일:** 모든 강의 관련 답변은 `retrieve → answer → verify/cite` 3단계를 거친다. 반드시 강의 클립을 인용한다.

#### 🍃 Instructor Agent — 강사를 위한 인사이트 어시스턴트

**대상:** 강사
**목적:** 강사가 100명에게 같은 답을 반복하지 않게 만든다. 학생들이 막히는 지점을 데이터로 보여준다.
**페르소나:** "교무실에 앉은 조용한 데이터 분석가" — 묻기 전에 먼저 알려준다

**Tools:**

| Tool | 역할 | 입력 데이터 |
|------|------|-----------|
| `qa_aggregator` | 학습자 질문을 의미 단위로 클러스터링 → "상위 10개 질문" | Learner Agent의 대화 로그 |
| `content_gap_finder` | 오답률 높은 개념 = 강의에서 충분히 다루지 못한 부분 탐지 | quiz_results, code_reviews |
| `auto_qa_responder` | 강사 검토 대기 중인 Q&A에 AI 초안 작성 → 강사 1-click 승인 | RAG + 강의 메타데이터 |
| `student_struggle_reporter` | 특정 학생이 며칠째 막혀있는지 + 어떤 개념인지 알림 | 학습 시간, 진도, 퀴즈 패턴 |

**핵심 가치:** "강사의 분신"이 아니라 "강사의 의사결정 지원 시스템". Wharton Hack-AI-thon 1등 Dyscover와 같은 "교사 지원 도구" 차별화 각도.

#### 🌿 Platform Agent — 비즈니스 의사결정을 위한 운영 OS

**대상:** 운영자 / 콘텐츠 PD / CMO
**목적:** "어떤 강의를 만들고, 누구에게 어떤 프로모션을 보낼지"에 데이터로 답한다.
**페르소나:** "조용한 사업기획팀 대리" — 매주 한 번 기회를 보고한다

**Tools:**

| Tool | 역할 | 비즈니스 임팩트 |
|------|------|----------------|
| `course_demand_analyzer` | "검색은 했지만 결과가 없거나 만족도 낮은 쿼리" 추출 → 신규 강의 후보 | 신규 강의 ROI 예측 |
| `trend_detector` | 검색량 급증 키워드 + 외부 트렌드(GitHub stars 등) 결합 | 콘텐츠 기획 선제 대응 |
| `promotion_recommender` | 학습자 프로필 세그먼트별 맞춤 프로모션 대상 추천 | 일괄 발송 → 정밀 타겟 |
| `revenue_optimizer` | 강의별 완강률 × 만족도 × 매출 매트릭스로 우선순위 | 운영 리소스 배분 |

**핵심 가치:** Clover가 단순 학습 도구가 아닌 **수익 최적화 파트너**임을 증명. KEG와 같은 B2B 고객에게 직접적인 ROI를 제시.

### 3-3. 핵심 차별점 — 상호 보완적 데이터 흐름

```
        ┌────────────────────────────────────────────────────────┐
        │              Cross-Agent Data Bus                       │
        │   (Supabase: 모든 에이전트가 읽고 쓰는 공유 상태)         │
        └────────────────────────────────────────────────────────┘
              ▲                  ▲                  ▲
              │                  │                  │
   ┌──────────┴──────┐  ┌────────┴──────┐  ┌────────┴────────┐
   │ 🌱 Learner       │  │ 🍃 Instructor │  │ 🌿 Platform     │
   │ Agent            │  │ Agent          │  │ Agent           │
   │                  │  │                │  │                 │
   │ writes:          │  │ writes:        │  │ writes:         │
   │ - quiz_results   │  │ - qa_drafts    │  │ - demand_reports│
   │ - chat_logs      │  │ - gap_reports  │  │ - promotions    │
   │ - code_reviews   │  │ - struggle_alerts │ │                │
   │                  │  │                │  │                 │
   │ reads:           │  │ reads:         │  │ reads:          │
   │ - profile        │  │ - chat_logs    │  │ - chat_logs     │
   │ - course_clips   │  │ - quiz_results │  │ - search_logs   │
   │                  │  │ - code_reviews │  │ - quiz_results  │
   └──────────────────┘  └───────────────┘  └─────────────────┘
              │                  │                  │
              ▼                  ▼                  ▼
         [학습자]              [강사]            [운영자]
```

**한 사이클 예시:**

1. 학습자 A가 "클로저랑 실행 컨텍스트가 헷갈려요"라고 질문 → **Learner Agent**가 답변, `chat_log`에 기록
2. 학습자 B, C, D, ... 50명이 같은 종류의 질문 → **Instructor Agent**가 클러스터링 감지 → 강사에게 "이 개념 보강 필요" 알림 + 보강 콘텐츠 초안 생성
3. **Platform Agent**가 "클로저 보강 콘텐츠 검색은 많은데 매칭되는 강의 없음" 신호 감지 → 운영자에게 "신규 강의 기획 후보" 리포트
4. 운영자가 신규 강의 발주 → 학습자 A에게 "찾고 있던 그 강의가 나왔어요" 프로모션 → 학습자 만족 ↑

이 흐름은 **데이터 1바이트도 외부에서 받지 않고 학습자 자신의 활동만으로 완성된다.** 데이터가 흐르기 시작하는 순간 교육 생태계 전체가 자기 강화 루프로 진입한다.

---

## 4. Architecture

### 4-1. 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                  Sample LMS Container (Demo Stage)               │
│              따즈아-style B2B Learning Management                 │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Learner UI   │  │Instructor UI │  │Platform UI   │          │
│  │ (수강생)      │  │ (강사)        │  │ (운영자)      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          │ SSE / REST     │ SSE / REST     │ SSE / REST
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Clover Backend                              │
│                  (FastAPI + LangGraph)                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           LangGraph Multi-Agent Orchestrator                │ │
│  │                                                              │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │ │
│  │  │🌱 Learner    │ │🍃 Instructor │ │🌿 Platform   │       │ │
│  │  │   Agent      │ │   Agent      │ │   Agent      │       │ │
│  │  │ (ReAct)      │ │ (ReAct)      │ │ (ReAct)      │       │ │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘       │ │
│  │         │                │                │                │ │
│  │         └────────────────┼────────────────┘                │ │
│  │                          ▼                                  │ │
│  │             [Cross-Agent Data Bus]                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         ▼                  ▼                  ▼                 │
│   ┌──────────┐       ┌──────────┐       ┌──────────┐           │
│   │ pgvector │       │PostgreSQL│       │OpenAI    │           │
│   │ (RAG)    │       │ (state)  │       │GPT-4o-   │           │
│   │          │       │          │       │mini      │           │
│   └──────────┘       └──────────┘       └──────────┘           │
│                  Supabase                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 4-2. LangGraph Multi-Agent 구조

```python
# Pseudocode — 실제 구현은 src/backend/agents/ 에서

clover_graph = StateGraph(CloverState)

# 각 에이전트는 독립 ReAct 노드
clover_graph.add_node("learner_agent", create_react_agent(learner_tools, model))
clover_graph.add_node("instructor_agent", create_react_agent(instructor_tools, model))
clover_graph.add_node("platform_agent", create_react_agent(platform_tools, model))

# 진입점은 라우터 (어떤 페르소나가 호출했는가)
clover_graph.add_node("router", role_router)
clover_graph.add_conditional_edges(
    "router",
    route_by_persona,  # learner | instructor | platform
    {
        "learner": "learner_agent",
        "instructor": "instructor_agent",
        "platform": "platform_agent",
    }
)

# 모든 에이전트는 같은 Cross-Agent Data Bus(state)에 read/write
```

각 에이전트는 자신만의 Tool 세트를 가지지만, **state(Cross-Agent Data Bus)는 공유**한다. 한 에이전트가 쓴 데이터는 즉시 다른 에이전트가 읽을 수 있다.

### 4-3. Learner Agent 가드레일 (필수)

```
[retrieve]    : course_search (RAG) 호출 → 관련 강의 클립 K개
[answer]      : 검색 결과 기반 답변 초안 생성
[verify/cite] : 답변이 검색 결과에 근거하는지 검증, 출처(강의 클립 위치) 인용
                근거 부족 시 "그 부분은 제가 강의에서 찾지 못했어요. 강사님께 전달할까요?"
                → Instructor Agent의 qa_aggregator에 자동 큐잉
```

이 가드레일은 환각(hallucination) 방지뿐 아니라 **Instructor Agent에게 자연스럽게 데이터를 흘려보내는 진입점** 역할을 한다.

### 4-4. Cross-Agent Data Bus — 데이터 모델

```sql
-- 공유 테이블 (모든 에이전트 read/write)
chat_logs           (id, user_id, role, agent_type, message, concept_ids, created_at)
quiz_results        (id, user_id, concept_id, is_correct, response_time_ms, ...)
code_reviews        (id, user_id, course_id, code, feedback, concepts_used, ...)
search_logs         (id, user_id, query, result_count, satisfaction_score, ...)

-- Learner-owned
learner_profiles    (id, user_id, career_goal, experience_level, available_minutes, ...)
review_schedules    (id, user_id, concept_id, next_review_at, easiness_factor, ...)

-- Instructor-owned (Instructor Agent가 생성, 강사가 확인)
qa_drafts           (id, instructor_id, source_question_ids[], draft_answer, status)
content_gap_reports (id, instructor_id, concept_id, struggle_count, suggestion, ...)
struggle_alerts     (id, instructor_id, student_id, concept_id, days_stuck, ...)

-- Platform-owned (Platform Agent가 생성, 운영자가 확인)
demand_reports      (id, period, missing_topics[], confidence, ...)
trend_signals       (id, keyword, signal_strength, source, detected_at)
promotion_targets   (id, segment_definition, target_user_count, recommended_offer, ...)

-- 강의 콘텐츠 (RAG, pgvector)
course_clips        (id, course_id, chapter_no, clip_no, ts_start, ts_end,
                     script_text, concept_id, embedding)
misconceptions      (id, concept_id, misconception_text, correction_text, embedding)
```

`concept_id`는 모든 테이블을 가로지르는 **공통 키**다. 학습자의 오답 → 콘텐츠 갭 → 신규 강의 수요까지, 같은 `concept_id`로 추적된다.

### 4-5. SSE Protocol — Backend → Frontend

| Event | Payload | 사용처 |
|-------|---------|--------|
| `token` | Incremental text chunk | 채팅 스트리밍 |
| `tool_call` | `{ agent, tool_name, args }` | "지금 어떤 에이전트가 어떤 도구를 호출 중인가" 시각화 |
| `tool_result` | `{ tool_name, result }` | 결과 즉시 표시 |
| `agent_handoff` | `{ from_agent, to_agent, reason }` | 에이전트 간 데이터 전달 시 시각화 |
| `message_part` | Complete message segment | 부분 메시지 확정 |
| `done` | Stream end signal | 종료 |

`agent_handoff` 이벤트는 데모에서 "Learner Agent의 발견이 Instructor Agent에 전달되는 순간"을 시각적으로 보여주는 핵심 어필 포인트다.

---

## 5. Sample LMS Container

### 5-1. 왜 샘플 LMS를 만드는가?

Clover는 **독립 제품이 아니다.** Clover는 어떤 LMS에든 임베딩되는 **B2B 오케스트레이터**다. 그러나 심사위원에게 이를 설명만으로 전달할 수는 없다. 따라서 데모를 위해 따즈아 스타일의 **샘플 LMS 컨테이너**를 직접 만들어 무대로 활용한다.

> **컨테이너는 무대일 뿐, Clover가 주인공이다.** 컨테이너는 의도적으로 단순하게 유지하여 Clover의 기능에 시선이 집중되도록 한다.

### 5-2. 샘플 LMS 구성

| 영역 | 내용 | 구현 범위 |
|------|------|---------|
| **수강생 페이지** | 강의 목록, 강의 시청, 진도 표시, **Clover Learner 채팅 사이드패널** | 핵심 |
| **강사 페이지** | 내 강의 목록, Q&A 받은 편지함, **Clover Instructor 인사이트 패널** | 핵심 |
| **운영자 페이지** | 매출 대시보드 (목업), **Clover Platform 위클리 리포트** | 핵심 |
| **로그인** | 3개 페르소나 1-click 로그인 (학습자 / 강사 / 운영자) | 단순 |
| **강의 컨텐츠** | Python 기초 1개 강의 (3~5강), concept_id 메타데이터 포함 | 시드 데이터 |

### 5-3. 디자인 톤 (따즈아 스타일)

- **컬러:** Emerald 그린 (`#10B981`) primary + 화이트 + 차분한 그레이
- **타이포:** Pretendard (Korean), 친근한 라운드 폰트
- **레이아웃:** 좌측 사이드바 + 메인 콘텐츠 + 우측 Clover 패널 (sticky)
- **분위기:** 따즈아의 친근함을 차용하되, "AI가 일하고 있다"는 기술적 무게감을 Clover 패널이 책임진다

### 5-4. 임베딩 가능성 증명

샘플 LMS와 Clover 백엔드는 **명확히 분리**된다:

```
┌────────────────────┐         ┌─────────────────────┐
│  Sample LMS        │  REST   │  Clover Backend     │
│  (Next.js, 컨테이너) │ ◄──────►│  (FastAPI + LG)     │
│                    │  SSE    │                     │
└────────────────────┘         └─────────────────────┘
```

이 분리 구조 자체가 "Clover는 어떤 LMS에든 동일하게 붙는다"는 증명이다. 데모 발표 시 "이 LMS는 한 시간 만에 만든 무대입니다. 우리가 자랑하는 것은 이 안에 들어있는 Clover입니다"라고 명시한다.

---

## 6. Demo Scenario

총 5분 시연. 한 사용자 스토리가 3개 에이전트를 모두 거치며 **데이터가 흘러가는 모습**을 보여주는 것이 목표.

### 시나리오 한 줄 줄거리

> "수강생 민지가 클로저 개념에서 막혀 질문 → Learner Agent가 도움 → 같은 종류의 질문이 누적 → Instructor Agent가 강사에게 알림 → Platform Agent가 신규 강의 기획 후보로 제안 → 운영자가 한 클릭으로 의사결정"

### 5단계 데모

| 단계 | 시간 | 페르소나 | 시연 내용 | 시연 에이전트 |
|------|------|---------|---------|-------------|
| **1. Hook** | 30초 | 내레이터 | "교육 플랫폼은 학습자만 보고 있습니다. 강사는? 운영자는? Clover는 셋을 동시에 봅니다." Clover 로고 + 3 에이전트 인트로 | — |
| **2. Learner** | 90초 | 수강생 (민지) | (1) 신규 학습자 온보딩 → 프로필 생성 → 맞춤 강의 추천. (2) 강의 시청 중 "클로저가 헷갈려요" 질문 → "3-1강 8:45에서 설명합니다" + 즉석 미니퀴즈. (3) 오답 시 강의 근거 인용 교정 | 🌱 Learner |
| **3. Instructor** | 90초 | 강사 (수민쌤) | 강사 페이지 진입 → Clover Instructor 인사이트 패널: "이번 주 학습자 50명 중 18명이 클로저 개념에서 막혔어요" + 자동 생성된 보강 답변 초안 + 강사 1-click 승인 → Q&A에 자동 게시 | 🍃 Instructor |
| **4. Platform** | 60초 | 운영자 (PD 김 매니저) | 운영자 페이지 진입 → Clover Platform 위클리 리포트: "지난주 검색량 급증 키워드 Top 3", "결과 없는 검색 쿼리 47건 → 신규 강의 후보 리스트", "프로모션 대상 추천 (학습자 세그먼트 234명)" | 🌿 Platform |
| **5. Closing** | 30초 | 내레이터 | Tool Calling 로그 오버레이로 `agent_handoff` 시각화 → "민지의 질문 한 줄이 강사의 보강 콘텐츠가 되고, 운영자의 신규 강의가 됩니다. 이것이 Clover입니다." | 전체 |

### 데모 핵심 어필 포인트

1. **단일 데이터, 3중 활용** — 같은 `concept_id` (클로저)가 3 에이전트의 화면에 다른 모습으로 등장
2. **agent_handoff 시각화** — 에이전트 간 데이터 전달이 SSE로 실시간 표시
3. **한 클릭 액션** — 강사가 1-click으로 AI 초안을 승인하고, 운영자가 1-click으로 신규 강의 발주를 검토한다 (실제 발주는 데모에서 상세화 안함)
4. **임베딩 가능성** — 마지막에 컨테이너 LMS와 Clover 분리 다이어그램 1초 노출

---

## 7. Tech Stack

| 레이어 | 기술 | 선택 이유 |
|--------|------|---------|
| Frontend (Sample LMS) | Next.js 14 (App Router, TypeScript) | SSR + Vercel 배포 + SSE 처리 우수 |
| Backend | FastAPI (Python 3.11+) | LangGraph 생태계 호환, async 지원 |
| AI Orchestration | **LangGraph** | Multi-agent state machine, ReAct 패턴, agent handoff 네이티브 지원 |
| LLM | OpenAI GPT-4o-mini | 비용 효율 + Tool Calling + 한국어 |
| Embedding | text-embedding-3-small | 한국어 지원 + 비용 효율 |
| Vector DB | pgvector (Supabase) | 강의 콘텐츠 RAG |
| RDBMS | Supabase (PostgreSQL) | Cross-Agent Data Bus의 실체 |
| 인증 | Supabase Auth (3 페르소나 1-click 로그인) | 데모 단순화 |
| 배포 | Vercel (FE) + Railway/Render (BE) | 빠른 무료 배포 |
| UI 컴포넌트 | shadcn/ui + Tailwind | Emerald 컬러팔레트 통일 |

### MVP 원칙

> **3 Tools 완벽 > 7 Tools 어설프게**

각 에이전트 별로 MVP 필수 Tool을 명확히 구분한다:

| 에이전트 | MVP 필수 (D1~D5) | Stretch (D6~D7) |
|---------|-----------------|----------------|
| 🌱 Learner | profile_manager, course_search, course_recommender | quiz_generator, review_scheduler, code_reviewer |
| 🍃 Instructor | qa_aggregator, content_gap_finder | auto_qa_responder, student_struggle_reporter |
| 🌿 Platform | course_demand_analyzer | trend_detector, promotion_recommender, revenue_optimizer |

총 6개 MVP Tool. 이 6개로 데모 5단계가 모두 동작 가능한 수준이 목표.

---

## 8. Differentiators

### 8-1. 경쟁 매트릭스

| 기능 | Khanmigo | Coursera Coach | Cursor | CodeRabbit | 엘리스 | **Clover** |
|------|:--------:|:--------------:|:------:|:----------:|:-----:|:---------:|
| AI 채팅 Q&A | O | O | O | X | 제한 | **O** |
| RAG 기반 강좌 특화 | X | X | X | X | X | **O** |
| 커리큘럼 인식 코드 리뷰 | 부분 | 부분 | X | X | 제한 | **O** |
| 학습자 데이터 → 강사 인사이트 | X | X | X | X | 부분 | **O ⭐** |
| 학습자 데이터 → 운영 의사결정 | **X** | **X** | **X** | **X** | **X** | **O ⭐⭐** |
| Multi-Agent 협업 | X | X | X | X | X | **O ⭐⭐⭐** |
| LMS-agnostic 임베딩 | X | X | X | X | X | **O** |
| 한국어 지원 | X | 부분 | O | O | O | **O** |

⭐⭐⭐ = Clover만의 시장 공백 (white space)

### 8-2. 차별점 3가지

#### 차별점 1: **3-Agent Orchestration** — 시장 최초

- 시장의 모든 AI 교육 도구는 단일 에이전트(학습자만 본다)
- Clover는 학습자·강사·운영자 3개 전용 에이전트가 협업하는 multi-agent 시스템
- LangGraph 기반 정식 multi-agent 구조 → 기술적으로도 최신 패턴

#### 차별점 2: **Cross-Agent Data Bus** — 데이터 흐름의 자동화

- 한 에이전트가 만든 데이터가 다른 에이전트의 입력이 됨
- 학습자 50명의 같은 질문 → 강사의 보강 콘텐츠 → 운영자의 신규 강의
- 외부 입력 1바이트 없이 자기강화 루프로 동작

#### 차별점 3: **LMS-agnostic 임베딩 모델** — B2B 비즈니스 모델

- Clover는 LMS 자체가 아닌 LMS 위에 올라가는 오케스트레이터
- 인프런·패스트캠퍼스·KEG 어디든 동일하게 임베딩
- 데모에서 샘플 LMS 컨테이너를 분리 구조로 보여줌으로써 증명

### 8-3. 해커톤 수상 요인 정렬

> 출처: `painpoint-research.md` 섹션 9 (수상작 패턴 분석)

| 심사 선호 요소 | Clover의 대응 |
|---------------|--------------|
| 실제 페인포인트 해결 | 4 플랫폼 리서치 데이터 + 3 주체 페인포인트 명시 |
| 기술적 깊이 + 설명력 | LangGraph multi-agent + Cross-Agent Data Bus 구조 명확 |
| 차별화된 관점 | "또 다른 AI 튜터"가 아닌 "교육 생태계 OS" |
| 동작하는 프로토타입 | 6개 MVP Tool로 데모 5단계 전 구간 동작 |
| AI 활용 필수성 | 3 에이전트 multi-agent 협업은 AI 없이 불가능 |

---

## 9. Roadmap

### Phase 0: 셋업 (D1, 04/07)

- 모노레포 구조 (`src/backend`, `src/frontend`, `supabase`)
- Supabase 프로젝트 + pgvector 활성화
- DB 스키마 마이그레이션 (Cross-Agent Data Bus 전체 테이블)
- LangGraph 프로젝트 골격 + 3 에이전트 placeholder 노드
- 평가셋 20문항 작성 (RAG 검증용)
- 샘플 강의 1개 시드 데이터 준비 (Python 기초, concept_id 포함)

### Phase 1: Learner Agent MVP (D2~D3, 04/08~04/09)

- D2: RAG 파이프라인 구축 (자동 청킹 + 임베딩 + course_search Tool) + 평가셋 정량 검증
- D3: profile_manager + course_recommender + Learner ReAct 에이전트 통합
- D3 종료: 학습자 페이지 (Sample LMS) 채팅 사이드패널 동작

### Phase 2: Instructor Agent MVP (D4, 04/10)

- qa_aggregator (의미 클러스터링)
- content_gap_finder (concept_id별 오답률 집계)
- 강사 페이지 (Sample LMS) 인사이트 패널 동작
- Cross-Agent Data Bus를 통해 Learner Agent의 chat_logs 활용 검증

### Phase 3: Platform Agent MVP + Stretch (D5~D6, 04/11~04/12)

- D5: course_demand_analyzer + 운영자 페이지 위클리 리포트
- D5: Stretch Tool 최대한 추가 (quiz_generator, code_reviewer, auto_qa_responder)
- D6: Frontend 통합 + agent_handoff SSE 시각화 + 데모 시나리오 전체 리허설

### Phase 4: 제출 (D7, 04/13)

- 최종 QA + 데모 영상 녹화 + AI 활용 리포트 작성 + 배포 + 제출

### Day-by-Day 요약

| Day | 날짜 | 마일스톤 |
|-----|------|---------|
| D1 | 04/07 | Phase 0: 셋업 + 평가셋 + 시드 데이터 |
| D2 | 04/08 | Phase 1a: RAG + course_search 정량 검증 |
| D3 | 04/09 | Phase 1b: Learner Agent 3-Tool 완성 + 학습자 페이지 |
| D4 | 04/10 | Phase 2: Instructor Agent + 강사 페이지 |
| D5 | 04/11 | Phase 3a: Platform Agent + Stretch Tools |
| D6 | 04/12 | Phase 3b: 통합 + agent_handoff 시각화 + 리허설 |
| D7 | 04/13 | Phase 4: QA + 제출 |

---

## 10. Risks & Mitigations

| 리스크 | 영향도 | 대응 전략 |
|--------|:-----:|---------|
| **Multi-agent 복잡도 폭증** — 3 에이전트 + Cross-Agent Bus를 1주일에 모두 완성하지 못함 | **최고** | 각 에이전트별 MVP Tool을 명확히 구분(6개). Stretch는 시간 남을 때만. 에이전트 간 통신은 LangGraph state로만 처리하고 별도 메시지 큐 도입 금지 |
| **"3 Tool 완벽 > 7 Tool 어설프게" 원칙 무시** | **최고** | 매일 종료 시 demo readiness check. 동작 안 하면 다음 Tool로 넘어가지 않음 |
| **RAG 검색 품질 미흡** — Learner Agent의 답변이 환각 | 높음 | D2에 평가셋 20문항으로 정량 검증. 가드레일에서 근거 부족 시 답변 보류 + Instructor Agent로 큐잉 |
| **Cross-Agent Data Bus가 데모용 fake data로 보임** | 높음 | 시드 데이터는 학습자 5명 × 질문 10개 분량 직접 생성. concept_id 일관성 유지. "이 데이터는 모두 학습자 활동에서 자연 발생"임을 데모에서 명시 |
| **샘플 LMS에 시간 낭비** | 중간 | LMS 컨테이너는 의도적으로 단순. shadcn 컴포넌트 + 1일 이내 완성. 모든 시각적 디테일은 Clover 패널에 집중 |
| **LangGraph 학습 곡선** | 중간 | Day 1에 prebuilt `create_react_agent` + StateGraph 패턴만 사용. 커스텀 노드는 라우터 1개로 제한 |
| **3 페르소나 전환 UX 혼란** | 낮음 | 1-click 페르소나 스위처를 헤더 우상단 고정. 데모에서는 미리 3개 탭을 열어둔다 |
| **배포 환경 이슈** | 낮음 | Vercel(FE) + Railway/Render(BE) 조합. 백업으로 로컬 데모 영상 사전 녹화 |

### 핵심 운영 원칙

1. **매일 종료 시 demo readiness check** — D-day부터 거꾸로 계산해 "오늘 끝나면 데모 5단계 중 어디까지 동작하는가"를 확인
2. **Stretch는 진짜로 stretch** — MVP 6 Tool이 동작하기 전에는 어떤 Stretch Tool도 시작하지 않음
3. **샘플 LMS는 무대, Clover는 주인공** — UI 디테일에 시간 쓰지 않음
4. **데모 시나리오 역산 개발** — 데모 5단계 각 단계가 동작하지 않으면 그 기능은 출시하지 않음

---

## 부록 A: 용어 정의

| 용어 | 정의 |
|------|------|
| **Clover** | 본 프로젝트의 코드네임이자 제품명. 3-agent 교육 오케스트레이터 |
| **Learner Agent / 🌱** | 수강생 전용 AI 에이전트. 학습 성공이 목적 |
| **Instructor Agent / 🍃** | 강사 전용 AI 에이전트. 강사 의사결정 지원이 목적 |
| **Platform Agent / 🌿** | 운영자 전용 AI 에이전트. 비즈니스 수익성이 목적 |
| **Cross-Agent Data Bus** | 3 에이전트가 공유하는 Supabase 상의 데이터 레이어 |
| **Sample LMS Container** | Clover 데모를 위해 만든 따즈아 스타일 1회용 LMS 무대 |
| **concept_id** | 강의·오답·수요 데이터를 가로지르는 공통 키 |
| **agent_handoff** | 에이전트 간 데이터 전달 이벤트 (SSE로 시각화) |
| **MVP 6 Tool** | 데모 5단계가 동작하기 위해 반드시 완성해야 할 6개 Tool |

---

## 부록 B: 참고 문헌

- `doc/painpoint-research.md` — 4 플랫폼 페인포인트 1차 리서치
- Hattie, J. & Timperley, H. (2007). "The Power of Feedback." 즉시 피드백 효과 d=0.73
- Cepeda, N. J. et al. (2006). 간격 반복 메타분석. 기억 유지율 150~200% 향상
- Freeman, S. et al. (2014). 능동 학습 메타분석. 시험 점수 6% 향상, 낙제율 33% 감소
- MIT/Harvard MOOC 연구 — 완강률 3~15%
- freeCodeCamp 2022 설문 — 튜토리얼 지옥 65% 경험
- Stack Overflow 2020 — 개발자 임포스터 신드롬 58%
- Hofstede 문화 차원 — 한국 불확실성 회피 지수 85
- Microsoft AI Classroom Hackathon 2024, Wharton Hack-AI-thon 2025 등 수상작 분석

---

> **문서 끝.** Clover 🍀 — 교육에 행운을, 모두에게.
