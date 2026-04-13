# 나만의 AI 튜터 (My AI Tutor)

## Project Overview
- **공모전**: KIT 바이브코딩 2026 (KEG 주최, 제출 마감 2026-04-13)
- **목표**: 학습자 맞춤형 AI 튜터 — 프로필 기반 과정 추천 및 질의응답

## Tech Stack
- **Backend**: FastAPI + LangGraph (Python 3.11+)
- **Frontend**: Next.js 14 (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL + pgvector)
- **LLM**: OpenAI GPT-4o-mini (via LangGraph ReAct agent)

## Directory Structure
```
backend/        # FastAPI server (Python)
frontend/       # Next.js app (TypeScript)
doc/            # Planning docs (PRD, architecture, etc.)
```

## MVP Principle
**3 Tools 완벽 > 7 Tools 어설프게**

Core tools (must be production-quality):
1. `profile_manager` — 학습자 프로필 CRUD
2. `course_search` — RAG 기반 과정 검색
3. `course_recommender` — 프로필 + 검색 결합 추천

## LangGraph Architecture
- `create_react_agent` with ReAct pattern
- Guard-rail flow: retrieve → answer → verify
- Tool selection is LLM-driven (no hardcoded routing)

## SSE Protocol (Backend → Frontend)
Event types streamed over `/api/chat`:
| Event | Payload |
|-------|---------|
| `token` | Incremental text chunk |
| `tool_call` | Tool name + args |
| `tool_result` | Tool execution result |
| `message_part` | Complete message segment |
| `done` | Stream end signal |

## Coding Rules
- **Immutability**: Always create new objects, never mutate
- **Small files**: 400 lines max per file
- **Error handling**: Explicit at every level, never swallow errors
- **Commits**: Conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
- **Language**: Code & commits in English, user-facing UI in Korean

## Decision Rules
- **Do not defer work citing the submission deadline.** There is enough time to
  address issues properly. When reporting on bugs, latent defects, or dead code,
  never use phrases like "마감 직전이라 그대로 두는 게 안전" as the reason to
  skip a fix. Evaluate fixes purely on their own merits — scope, risk, test
  coverage, regression surface — and propose concrete options to the user.
  "Leave it for later" is only a valid recommendation when there is a real
  technical reason (e.g. the fix requires infrastructure that doesn't exist
  yet), not because of schedule pressure.
