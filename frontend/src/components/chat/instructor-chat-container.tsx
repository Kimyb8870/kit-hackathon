"use client";

import { useEffect, useRef } from "react";
import { useInstructorStore } from "@/stores/instructor-store";
import { useInstructorChatStream } from "@/hooks/use-instructor-chat-stream";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { Loader2, Leaf } from "lucide-react";

const EXAMPLE_QUESTIONS: ReadonlyArray<string> = [
  "학생들이 어디서 막히고 있나요?",
  "최근 Q&A 패턴 요약해주세요",
  "보충 클립이 필요한 주제는?",
  "운영자에게 전달할 개선 리포트 만들어줘",
];

// Instructor-side chat surface. Mirrors the learner ChatContainer but
// reads from the instructor store and skips the learner-only pending
// auto-message queue. Tool activity shows up in the ToolCallSideCard
// rendered alongside this container, so no overlay is mounted here.
export function InstructorChatContainer() {
  const { messages, isStreaming } = useInstructorStore();
  const { sendMessage } = useInstructorChatStream();
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
                <Leaf className="h-8 w-8 text-clover-600" />
              </div>
              <h2 className="text-lg font-semibold">
                강의 분석 어시스턴트에게 질문하세요
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                수강생 질문 분석, 보충 콘텐츠 제안, 학습 패턴 인사이트
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
