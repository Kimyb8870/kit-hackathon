"use client";

import { useEffect, useRef } from "react";
import { usePlatformStore } from "@/stores/platform-store";
import { usePlatformChatStream } from "@/hooks/use-platform-chat-stream";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { Loader2, TreePine } from "lucide-react";

const EXAMPLE_QUESTIONS: ReadonlyArray<string> = [
  "어떤 카테고리 수요가 늘고 있나요?",
  "강사 리포트 종합 분석해줘",
  "프로모션 제안해줘",
];

// Platform-side chat surface. Same structure as InstructorChatContainer
// but bound to the platform store and hook so the two sessions don't
// leak state into each other.
export function PlatformChatContainer() {
  const { messages, isStreaming } = usePlatformStore();
  const { sendMessage } = usePlatformChatStream();
  // See chat-container.tsx for the rationale: scrollIntoView bubbles up to
  // ancestor scroll containers, which pulls the host LMS page when this
  // chat is rendered inside an iframe. Scroll the inner container only.
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-gradient-to-br from-clover-300/40 to-clover-500/30 p-4">
                <TreePine className="h-8 w-8 text-clover-600" />
              </div>
              <h2 className="text-lg font-semibold">
                플랫폼 운영 어시스턴트에게 질문하세요
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                수요 분석, 트렌드 탐지, 프로모션 추천
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {EXAMPLE_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => sendMessage(question)}
                    className="rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isStreaming &&
            messages.length > 0 &&
            messages[messages.length - 1].content === "" && (
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
    </div>
  );
}
