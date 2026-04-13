"use client";

import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";

interface MessageBubbleProps {
  readonly message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // Skip empty assistant placeholder messages — chat-container renders a
  // dedicated loading spinner for that state. Without this guard the user
  // briefly sees both an empty grey bubble (from MessageBubble) and the
  // spinner (from chat-container) stacked on top of each other.
  if (message.role === "assistant" && message.content === "") {
    return null;
  }

  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <Markdown
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: ({ children, ...props }) => (
                <pre
                  className="my-2 overflow-x-auto rounded-lg bg-black/20 p-3 text-xs"
                  {...props}
                >
                  {children}
                </pre>
              ),
              code: ({ children, className, ...props }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code
                      className="rounded bg-black/10 px-1.5 py-0.5 text-xs"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children, ...props }) => (
                <p className="mb-2 last:mb-0" {...props}>
                  {children}
                </p>
              ),
              ul: ({ children, ...props }) => (
                <ul className="mb-2 ml-4 list-disc last:mb-0" {...props}>
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="mb-2 ml-4 list-decimal last:mb-0" {...props}>
                  {children}
                </ol>
              ),
              strong: ({ children, ...props }) => (
                <strong className="font-semibold" {...props}>
                  {children}
                </strong>
              ),
              a: ({ href, children, ...props }) => {
                if (!href) return <span>{children}</span>;
                if (href.startsWith("/")) {
                  return (
                    <a
                      href={href}
                      target="_top"
                      className="inline-flex items-center gap-1 text-clover-600 underline decoration-clover-300 underline-offset-2 hover:text-clover-700 hover:decoration-clover-500"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                }
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-clover-600 underline decoration-clover-300 underline-offset-2 hover:text-clover-700"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {message.content}
          </Markdown>
        )}
      </div>
    </div>
  );
}
