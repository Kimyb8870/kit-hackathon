"use client";

import { useCallback, useRef } from "react";
import { useInstructorStore } from "@/stores/instructor-store";
import { useLmsContextStore } from "@/stores/lms-context-store";
import { connectSSE } from "@/lib/sse-client";
import type { Message } from "@/types/chat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const FALLBACK_INSTRUCTOR_ID = "demo-instructor";

export function useInstructorChatStream(): {
  readonly sendMessage: (text: string) => void;
  readonly isStreaming: boolean;
} {
  const abortRef = useRef<AbortController | null>(null);
  // Subscribe to isStreaming for the return value (so ChatInput can disable
  // itself), but read everything else lazily via getState() inside
  // sendMessage. This keeps the callback identity stable across stream ticks.
  const isStreaming = useInstructorStore((s) => s.isStreaming);

  const sendMessage = useCallback((text: string) => {
    const store = useInstructorStore.getState();
    if (store.isStreaming || text.trim().length === 0) return;

    const {
      messages: currentMessages,
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

    const allMessages = [...currentMessages, userMsg];
    const assistantMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      role: "assistant",
      content: "",
    };
    addMessage(assistantMsg);

    const lmsContext = useLmsContextStore.getState().instructor;
    const instructorId = lmsContext?.instructor_id ?? FALLBACK_INSTRUCTOR_ID;

    const payload: Record<string, unknown> = {
      instructor_id: instructorId,
      messages: allMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };
    if (lmsContext) {
      payload.lms_context = {
        instructor_id: lmsContext.instructor_id,
        course_ids: lmsContext.course_ids,
        time_window_days: lmsContext.time_window_days,
      };
    }

    connectSSE(`${API_BASE}/api/v1/instructor/chat/stream`, payload, {
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
    }).then((controller) => {
      abortRef.current = controller;
    });
  }, []);

  return { sendMessage, isStreaming };
}
