"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
} from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  readonly onSend: (text: string) => void;
  readonly isStreaming: boolean;
  // Quick prompt chips surfaced just above the textarea. When provided and
  // non-empty, the chips remain visible even after the conversation has
  // started so judges/first-time users always have an entry point. Clicking
  // a chip calls onSend(prompt) directly — this matches the legacy empty-
  // state behaviour but keeps the chips accessible mid-conversation.
  readonly quickPrompts?: ReadonlyArray<string>;
  readonly placeholder?: string;
}

export function ChatInput({
  onSend,
  isStreaming,
  quickPrompts,
  placeholder = "메시지를 입력하세요...",
}: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (text.trim().length === 0 || isStreaming) return;
    onSend(text);
    setText("");
  }, [text, isStreaming, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handlePromptClick = useCallback(
    (prompt: string) => {
      if (isStreaming) return;
      onSend(prompt);
    },
    [isStreaming, onSend]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [text]);

  const hasPrompts = quickPrompts !== undefined && quickPrompts.length > 0;

  return (
    <div className="border-t bg-background">
      {hasPrompts && (
        <div className="mx-auto flex max-w-3xl items-center gap-2 overflow-x-auto px-4 pt-3 pb-1">
          <Sparkles
            className="h-3.5 w-3.5 shrink-0 text-clover-500"
            aria-hidden
          />
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-clover-600">
            예시 질문
          </span>
          <div className="flex items-center gap-1.5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                disabled={isStreaming}
                className="shrink-0 whitespace-nowrap rounded-full border border-clover-100 bg-clover-50/60 px-2.5 py-1 text-[11px] font-medium text-clover-700 transition-colors hover:border-clover-300 hover:bg-clover-100/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-xl border bg-secondary px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={isStreaming || text.trim().length === 0}
            size="icon-lg"
            className="shrink-0 rounded-xl"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
