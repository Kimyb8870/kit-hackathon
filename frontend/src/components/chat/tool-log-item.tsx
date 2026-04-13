"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolLog } from "@/types/chat";

const TOOL_COLORS: Readonly<Record<string, string>> = {
  profile_manager: "bg-purple-500",
  course_search: "bg-blue-500",
  course_recommender: "bg-green-500",
  quiz_generator: "bg-yellow-500",
  review_scheduler: "bg-orange-500",
  code_reviewer: "bg-red-500",
};

interface ToolLogItemProps {
  readonly log: ToolLog;
}

function formatOutput(output: string): string {
  try {
    return JSON.stringify(JSON.parse(output), null, 2);
  } catch {
    return output;
  }
}

export function ToolLogItem({ log }: ToolLogItemProps) {
  const [expanded, setExpanded] = useState(false);
  const color = TOOL_COLORS[log.tool] ?? "bg-gray-500";
  const time = new Date(log.timestamp).toLocaleTimeString();

  return (
    <div className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50">
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", color)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{log.tool}</span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {log.duration !== undefined && (
            <span className="text-xs text-muted-foreground">
              {log.duration}ms
            </span>
          )}
          {log.status === "running" && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          )}
          {log.status === "success" && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {log.status === "error" && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Input
            </span>
            <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(log.input, null, 2)}
            </pre>
          </div>
          {log.output && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Output
              </span>
              <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
                {formatOutput(log.output)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
