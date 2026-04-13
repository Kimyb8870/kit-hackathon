"use client";

import { useInstructorStore } from "@/stores/instructor-store";
import { usePlatformStore } from "@/stores/platform-store";

interface ToolCallSideCardProps {
  readonly role: "instructor" | "platform";
}

// Human-readable tool labels. We display these instead of the raw function
// names so judges understand what Clover actually did rather than staring
// at snake_case identifiers.
const TOOL_LABELS: Record<string, { readonly label: string; readonly desc: string }> = {
  get_struggle_concepts: {
    label: "📊 학습 어려움 분석",
    desc: "수강생이 막힌 개념을 집계",
  },
  get_qa_patterns: {
    label: "❓ Q&A 패턴 파악",
    desc: "자주 묻는 질문을 요약",
  },
  get_content_gaps: {
    label: "🧩 콘텐츠 갭 탐색",
    desc: "보충 자료가 필요한 주제 발굴",
  },
  get_course_demand: {
    label: "📈 수요 트렌드 집계",
    desc: "카테고리별 학습 활동 분석",
  },
  get_trending_searches: {
    label: "🔥 트렌드 검색어",
    desc: "최근 검색 흐름 파악",
  },
  suggest_promotion: {
    label: "🎯 프로모션 추천",
    desc: "비즈니스 기회 제안",
  },
  search_courses: {
    label: "🔎 강의 검색",
    desc: "학습자 요청에 맞는 강의 탐색",
  },
  recommend_courses: {
    label: "✨ 강의 추천",
    desc: "프로필 기반 맞춤 추천",
  },
  generate_quiz: {
    label: "📝 퀴즈 생성",
    desc: "복습 퀴즈 자동 생성",
  },
  log_event: {
    label: "📡 Cross-Agent 이벤트",
    desc: "다른 agent에게 신호 전달",
  },
};

function humanizeTool(toolName: string): { label: string; desc: string } {
  return (
    TOOL_LABELS[toolName] ?? {
      label: toolName,
      desc: "도구 실행",
    }
  );
}

// Surfaces the most recent tool calls the instructor/platform chat agent
// has made so viewers can see "what Clover just did" alongside the main
// conversation pane. When the chat itself is hosted in an iframe (LMS
// embedded view), the toolLogs arrive over a BroadcastChannel bridge wired
// into the store — see instructor-store.ts / platform-store.ts.
export function ToolCallSideCard({
  role,
}: ToolCallSideCardProps) {
  const instructorLogs = useInstructorStore((s) => s.toolLogs);
  const platformLogs = usePlatformStore((s) => s.toolLogs);
  const toolLogs = role === "instructor" ? instructorLogs : platformLogs;

  const recent = toolLogs.slice(-5).slice().reverse();
  const roleEmoji = role === "instructor" ? "🍃" : "🌿";

  return (
    <aside className="rounded-[10px] border border-clover-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-clover-800">
          {roleEmoji} Clover가 한 일
        </h3>
        <span className="text-[10px] text-[#8a8d92]">
          {toolLogs.length}회 호출
        </span>
      </div>
      {recent.length === 0 ? (
        <div className="rounded-md border border-dashed border-clover-200 bg-clover-50/40 px-3 py-5 text-center">
          <p className="text-[11px] font-semibold text-clover-700">
            💬 대화를 시작해 보세요
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-gray-600">
            왼쪽 채팅에 질문을 입력하면
            <br />
            Clover가 실행한 도구가 여기 표시됩니다
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {recent.map((log) => {
            const humanized = humanizeTool(log.tool);
            return (
              <li
                key={log.id}
                className="rounded-md border border-clover-100 bg-clover-50/40 p-2"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-clover-900">
                    {humanized.label}
                  </span>
                  <span
                    className={
                      log.status === "success"
                        ? "text-[10px] font-semibold text-emerald-600"
                        : log.status === "error"
                        ? "text-[10px] font-semibold text-rose-600"
                        : "text-[10px] font-semibold text-clover-600"
                    }
                  >
                    {log.status === "running"
                      ? "실행 중"
                      : log.status === "success"
                      ? "완료"
                      : "오류"}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-600">
                  {humanized.desc}
                </p>
                {log.output && (
                  <p className="mt-1 line-clamp-2 font-mono text-[10px] text-[#8a8d92]">
                    {log.output.slice(0, 140)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
