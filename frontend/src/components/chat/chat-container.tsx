"use client";

import { useEffect, useRef } from "react";
import { useChatStore, type PendingAutoMessage } from "@/stores/chat-store";
import { useChatStream } from "@/hooks/use-chat-stream";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { ToolLogOverlay } from "./tool-log-overlay";
import { Loader2, GraduationCap } from "lucide-react";

const EXAMPLE_QUESTIONS = [
  "내 목표에 맞는 강의 추천해줘",
  "내가 등록한 강의 진행 상황 알려줘",
  "내가 약한 개념 분석해줘",
  "오늘 복습해야 할 것 알려줘",
] as const;

export function ChatContainer() {
  const { messages, isStreaming, toolLogs } = useChatStore();
  const pendingAutoMessage = useChatStore((s) => s.pendingAutoMessage);
  const clearPendingAutoMessage = useChatStore(
    (s) => s.clearPendingAutoMessage
  );
  const { sendMessage } = useChatStream();
  // Ref to the scrollable messages container. We scroll *this* element's
  // scrollTop directly instead of calling bottomRef.scrollIntoView(),
  // because scrollIntoView also scrolls every ancestor scroll container —
  // when ChatContainer is embedded inside an LMS iframe, that means the
  // parent LMS document gets pulled down on every new token.
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // De-dupe guard. We compare against the *previously dispatched object
  // reference* so that strict-mode double-invokes and intermediate re-renders
  // (which keep the same pendingAutoMessage instance) don't fire twice, while
  // a genuine re-click — which produces a brand-new object literal in
  // study-schedule — is correctly recognized as a new request.
  const lastDispatchedRef = useRef<PendingAutoMessage | null>(null);
  // Hold the latest sendMessage / clearPendingAutoMessage in refs so the
  // dispatch effect below can depend purely on [pendingAutoMessage,
  // isStreaming] without re-firing every time these function identities
  // change. Without this, sendMessage's useCallback identity churn during
  // a stream would cause the effect to run on every token, which is wasteful
  // and used to interact badly with the de-dupe guard on re-clicks.
  const sendMessageRef = useRef(sendMessage);
  const clearPendingRef = useRef(clearPendingAutoMessage);
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);
  useEffect(() => {
    clearPendingRef.current = clearPendingAutoMessage;
  }, [clearPendingAutoMessage]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, toolLogs]);

  // Drain any auto-message queued by another part of the app (e.g. the
  // study-schedule action buttons). We clear the queue *before* sending so
  // a re-render can't fire the same prompt twice, and we hold back while
  // another stream is in flight to avoid clobbering it. Deps are
  // intentionally minimal — see the refs above for the rationale.
  useEffect(() => {
    if (pendingAutoMessage === null) return;
    if (isStreaming) return;
    if (lastDispatchedRef.current === pendingAutoMessage) return;
    lastDispatchedRef.current = pendingAutoMessage;
    const text = pendingAutoMessage.text;
    const courseContext = pendingAutoMessage.courseContext;
    clearPendingRef.current();
    sendMessageRef.current(text, courseContext ? { courseContext } : undefined);
  }, [pendingAutoMessage, isStreaming]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-gradient-to-br from-clover-300/40 to-clover-500/30 p-4">
                <GraduationCap className="h-8 w-8 text-clover-600" />
              </div>
              <h2 className="text-lg font-semibold">
                AI 튜터와 대화를 시작해보세요!
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                강의 추천, 개념 질문, 코드 리뷰 등 무엇이든 물어보세요
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isStreaming && messages.length > 0 && messages[messages.length - 1].content === "" && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-secondary px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatInput
        onSend={sendMessage}
        isStreaming={isStreaming}
        quickPrompts={messages.filter((m) => m.role === "user").length === 0 ? EXAMPLE_QUESTIONS : undefined}
      />
      <ToolLogOverlay />
    </div>
  );
}
