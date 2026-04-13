"use client";

import { useCallback, useRef } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useProfileStore } from "@/stores/profile-store";
import { connectSSE } from "@/lib/sse-client";
import { MOCK_MESSAGES } from "@/lib/constants";
import type { Message, ToolLog } from "@/types/chat";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface MockToolStep {
  readonly tool: string;
  readonly input: Record<string, unknown>;
  readonly output: string;
  readonly delayMs: number;
}

const MOCK_TOOL_STEPS: ReadonlyArray<MockToolStep> = [
  {
    tool: "profile_manager",
    input: { action: "get" },
    output: '{"status":"success","profile":{"level":"beginner"}}',
    delayMs: 200,
  },
  {
    tool: "course_search",
    input: { query: "Python 학습" },
    output: '{"clips":2,"results":["Python 기초","Pandas 입문"]}',
    delayMs: 1200,
  },
  {
    tool: "course_recommender",
    input: { user_id: "default-user", top_k: 3 },
    output: '{"recommendations":1,"course":"Python 기초: 프로그래밍 첫걸음"}',
    delayMs: 800,
  },
];

async function simulateMockStream(
  addMessage: (msg: Message) => void,
  updateLastMessage: (content: string) => void,
  addToolLog: (log: ToolLog) => void,
  updateToolLog: (
    toolName: string,
    update: Partial<Pick<ToolLog, "output" | "status" | "duration">>
  ) => void,
  setIsStreaming: (streaming: boolean) => void
): Promise<void> {
  const mockResponses = MOCK_MESSAGES.filter((m) => m.role === "assistant");
  const response =
    mockResponses[Math.floor(Math.random() * mockResponses.length)];
  const content = response.content;

  for (const step of MOCK_TOOL_STEPS) {
    const logId = `tool-${Date.now()}-${step.tool}`;
    addToolLog({
      id: logId,
      tool: step.tool,
      input: step.input,
      output: "",
      status: "running",
      timestamp: Date.now(),
    });

    await delay(step.delayMs);

    updateToolLog(step.tool, {
      output: step.output,
      status: "success",
      duration: step.delayMs,
    });
  }

  const assistantMsg: Message = {
    id: `msg-${Date.now()}`,
    role: "assistant",
    content: "",
  };
  addMessage(assistantMsg);

  const chunks = content.match(/.{1,8}/g) ?? [content];
  for (const chunk of chunks) {
    updateLastMessage(chunk);
    await delay(30 + Math.random() * 40);
  }

  setIsStreaming(false);
}

// Optional structured course pointer that callers can pass through to the
// backend. When present, this overrides the per-session `courseContext`
// stored in the chat store — callers like the study-schedule auto-send
// flow already know exactly which clip the learner clicked, so they pass
// it directly instead of relying on whatever the iframe last set.
export interface SendMessageCourseContext {
  readonly course_id: string;
  readonly chapter_no?: number;
  readonly clip_no?: number;
}

export function useChatStream(): {
  readonly sendMessage: (
    text: string,
    options?: { readonly courseContext?: SendMessageCourseContext }
  ) => void;
  readonly isStreaming: boolean;
} {
  const abortRef = useRef<AbortController | null>(null);
  const userId = useProfileStore((s) => s.userId);
  // Subscribe to isStreaming for the return value (so ChatInput can disable
  // itself), but read everything else lazily inside sendMessage via
  // useChatStore.getState(). This keeps sendMessage's identity stable across
  // streaming updates and prevents stale-closure regressions where a
  // re-rendered consumer holds onto an isStreaming=true snapshot after the
  // stream has actually finished.
  const isStreaming = useChatStore((s) => s.isStreaming);

  const sendMessage = useCallback(
    (
      text: string,
      options?: { readonly courseContext?: SendMessageCourseContext }
    ) => {
      // Always read the latest store snapshot at call time. Previous
      // implementations captured `isStreaming` from the render closure,
      // which made re-clicks from the study-schedule action buttons miss
      // the first attempt: the effect-driven dispatch saw a stale `true`
      // even though the prior stream had already finished.
      const store = useChatStore.getState();
      if (store.isStreaming || text.trim().length === 0) return;
      // The page rendering this hook is protected by the auth proxy, but the
      // Supabase auth sync hook may not have landed the userId on the very
      // first frame. Guard here to avoid sending a request without identity.
      if (!USE_MOCK && !userId) return;

      const {
        messages: currentMessages,
        courseContext,
        addMessage,
        updateLastMessage,
        addToolLog,
        updateToolLog,
        setIsStreaming,
      } = store;

      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };
      addMessage(userMsg);
      setIsStreaming(true);

      if (USE_MOCK) {
        simulateMockStream(
          addMessage,
          updateLastMessage,
          addToolLog,
          updateToolLog,
          setIsStreaming
        );
        return;
      }

      const allMessages = [...currentMessages, userMsg];
      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "",
      };
      addMessage(assistantMsg);

      const payload: Record<string, unknown> = {
        user_id: userId,
        messages: allMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };

      // Caller-supplied courseContext (e.g. from a study-schedule click)
      // takes precedence over the iframe-derived session context. This
      // lets the schedule action buttons hand the agent an exact clip
      // pointer even when the user is on the standalone learner page.
      if (options?.courseContext) {
        payload.course_context = {
          course_id: options.courseContext.course_id,
          chapter_no: options.courseContext.chapter_no ?? null,
          clip_no: options.courseContext.clip_no ?? null,
        };
      } else if (courseContext) {
        payload.course_context = {
          course_id: courseContext.courseId,
          chapter_no: courseContext.chapterNo,
          clip_no: courseContext.clipNo,
        };
      }

      connectSSE(
        `${API_BASE}/api/v1/chat/stream`,
        payload,
        {
          onToken: (token) => {
            updateLastMessage(token);
          },
          onToolCall: (data) => {
            addToolLog({
              id: `tool-${Date.now()}-${data.tool}`,
              tool: data.tool,
              input: data.input,
              output: "",
              status: "running",
              timestamp: Date.now(),
            });
          },
          onToolResult: (data) => {
            updateToolLog(data.tool, {
              output: data.output,
              status: data.status === "error" ? "error" : "success",
              duration: data.duration,
            });
          },
          onDone: () => {
            setIsStreaming(false);
          },
          onError: (_error) => {
            updateLastMessage(
              "\n\n⚠️ 서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
            );
            setIsStreaming(false);
          },
        }
      ).then((controller) => {
        abortRef.current = controller;
      });
    },
    // Stable deps only: userId is the sole external value that changes the
    // outgoing payload. Everything else is read fresh from getState().
    [userId]
  );

  return { sendMessage, isStreaming };
}
