import type { AgentEvent } from "@/lib/api-client";

// 3-part description for cross-agent events — icon for quick scan, title
// for the "what happened", detail for the "why it matters / what it means".
// Both the toast and the activity feed read from the same function so the
// phrasing stays consistent.
export interface DescribedEvent {
  readonly icon: string;
  readonly title: string;
  readonly detail: string;
}

// Skip known debug/test fixture events so the judge-facing demo surface
// never shows noise. The backend load tests emit concept_id prefixed with
// "task-" (e.g. "task-80-final-verify") — those rows leak into the events
// table and would otherwise dominate the feed.
export function isDebugEvent(event: AgentEvent): boolean {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const candidates = [
    payload.concept_id,
    payload.top_concept_id,
    payload.focus_category,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("task-")) return true;
  }
  return false;
}

// Well-known concept IDs get a Korean label; unknown ones fall back to a
// prettified kebab-case version so the phrasing still looks deliberate.
const CONCEPT_LABELS: Record<string, string> = {
  "python-asyncio": "Python 비동기",
  "event-loop": "이벤트 루프",
  "async-await": "async/await",
  "async-basics": "async 기본",
  "react-hooks": "React Hooks",
  "typescript-generics": "TypeScript 제네릭",
  "closures": "클로저",
  "promise-chaining": "Promise 체이닝",
};

export function humanizeConcept(conceptId: unknown): string {
  if (typeof conceptId !== "string" || conceptId === "") {
    return "(개념 미지정)";
  }
  if (conceptId.startsWith("task-")) return "테스트 개념";
  if (conceptId in CONCEPT_LABELS) return CONCEPT_LABELS[conceptId];
  // Prettify kebab-case: "event-delegation" → "Event delegation"
  return conceptId
    .replace(/-/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function getStringField(
  payload: Record<string, unknown>,
  ...keys: ReadonlyArray<string>
): string | undefined {
  for (const k of keys) {
    const v = payload[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function getNumberField(
  payload: Record<string, unknown>,
  ...keys: ReadonlyArray<string>
): number | undefined {
  for (const k of keys) {
    const v = payload[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

export function describeEvent(event: AgentEvent): DescribedEvent {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  switch (event.event_type) {
    case "learner_struggle": {
      const concept = humanizeConcept(payload.concept_id);
      return {
        icon: "📚",
        title: "학습자 어려움 감지",
        detail: `'${concept}' 개념에서 막힘 — Instructor에게 자동 전달`,
      };
    }
    case "instructor_struggle_analyzed": {
      const concept = humanizeConcept(payload.top_concept_id);
      const accRaw = getNumberField(payload, "top_accuracy");
      const total = getNumberField(payload, "total_struggles") ?? 0;
      const accPct = Math.round((accRaw ?? 0) * 100);
      return {
        icon: "🍃",
        title: "강사 인사이트 생성",
        detail: `'${concept}' 정답률 ${accPct}%, ${total}명 영향 — Platform에 보고`,
      };
    }
    case "promotion_suggested": {
      const category =
        getStringField(payload, "focus_category", "category") ??
        "전체 카테고리";
      return {
        icon: "🌿",
        title: "Platform 결정",
        detail: `${category} 프로모션 제안 (운영자 검토 대기)`,
      };
    }
    case "qa_asked": {
      const hasCourse = typeof payload.course_id === "string";
      return {
        icon: "❓",
        title: "학습자 질문",
        detail: hasCourse ? "강의 컨텍스트 기반" : "일반 질문",
      };
    }
    case "quiz_attempted": {
      const isCorrect = Boolean(payload.is_correct);
      return {
        icon: "✏️",
        title: "퀴즈 시도",
        detail: isCorrect ? "정답" : "오답 (복습 일정 자동 조정됨)",
      };
    }
    default:
      return {
        icon: "📡",
        title: `${event.agent_name} 활동`,
        detail: event.event_type,
      };
  }
}

// Visual role → color classes. Single source of truth for badges in both
// the toast and activity feed so the colors never drift between surfaces.
export function agentPalette(name: AgentEvent["agent_name"]): {
  readonly badgeBg: string;
  readonly badgeText: string;
  readonly borderAccent: string;
  readonly label: string;
} {
  if (name === "learner") {
    return {
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-700",
      borderAccent: "border-blue-200",
      label: "🎓 Learner",
    };
  }
  if (name === "instructor") {
    return {
      badgeBg: "bg-clover-50",
      badgeText: "text-clover-700",
      borderAccent: "border-clover-200",
      label: "🍃 Instructor",
    };
  }
  return {
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    borderAccent: "border-emerald-200",
    label: "🌿 Platform",
  };
}
