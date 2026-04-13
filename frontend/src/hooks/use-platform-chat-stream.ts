"use client";

import { useCallback, useRef } from "react";
import { usePlatformStore } from "@/stores/platform-store";
import { useLmsContextStore } from "@/stores/lms-context-store";
import { connectSSE } from "@/lib/sse-client";
import type { Message } from "@/types/chat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// Backend `PlatformChatRequest.operator_id` is a required field. The LMS
// context store currently doesn't carry an operator identifier (the platform
// slice only holds role / focus categories / time window), so we fall back to
// this demo id. Replace with a real id once operator auth lands.
const FALLBACK_OPERATOR_ID = "demo-operator";

export function usePlatformChatStream(): {
  readonly sendMessage: (text: string) => void;
  readonly isStreaming: boolean;
} {
  const abortRef = useRef<AbortController | null>(null);
  const isStreaming = usePlatformStore((s) => s.isStreaming);

  const sendMessage = useCallback((text: string) => {
    const store = usePlatformStore.getState();
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

    const lmsContext = useLmsContextStore.getState().platform;
    const operatorId = FALLBACK_OPERATOR_ID;

    const payload: Record<string, unknown> = {
      operator_id: operatorId,
      messages: allMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };
    if (lmsContext) {
      payload.lms_context = {
        operator_role: lmsContext.operator_role,
        focus_categories: lmsContext.focus_categories,
        time_window_days: lmsContext.time_window_days,
      };
    }

    connectSSE(`${API_BASE}/api/v1/platform/chat/stream`, payload, {
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
