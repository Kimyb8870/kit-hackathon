"use client";

import { useChatStore } from "@/stores/chat-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Wrench, Check } from "lucide-react";
import { ToolLogItem } from "./tool-log-item";
import { cn } from "@/lib/utils";
import type { ToolLog } from "@/types/chat";

type GuardrailStep = "retrieve" | "answer" | "verify";

const STEPS: ReadonlyArray<{ readonly key: GuardrailStep; readonly label: string }> = [
  { key: "retrieve", label: "Retrieve" },
  { key: "answer", label: "Answer" },
  { key: "verify", label: "Verify" },
];

function deriveStep(
  toolLogs: ReadonlyArray<ToolLog>,
  isStreaming: boolean
): GuardrailStep | null {
  if (toolLogs.length === 0) return null;
  const hasRunning = toolLogs.some((l) => l.status === "running");
  if (hasRunning) return "retrieve";
  if (isStreaming) return "answer";
  return "verify";
}

function StepIndicator({
  currentStep,
}: {
  readonly currentStep: GuardrailStep | null;
}) {
  const stepIndex = currentStep
    ? STEPS.findIndex((s) => s.key === currentStep)
    : -1;

  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((step, i) => {
        const isCompleted = stepIndex > i;
        const isCurrent = stepIndex === i;
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-4",
                  isCompleted || isCurrent
                    ? "bg-blue-400"
                    : "bg-muted-foreground/30"
                )}
              />
            )}
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "animate-pulse bg-blue-500 text-white",
                  !isCompleted &&
                    !isCurrent &&
                    "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs",
                  isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ToolLogOverlay() {
  const { toolLogs, showToolLog, setShowToolLog, isStreaming } =
    useChatStore();
  const currentStep = deriveStep(toolLogs, isStreaming);
  const reversedLogs = [...toolLogs].reverse();

  return (
    <>
      {toolLogs.length > 0 && (
        <button
          type="button"
          onClick={() => setShowToolLog(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Wrench className="h-4 w-4" />
          <span className="text-sm font-medium">Tool Log</span>
          <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5">
            {toolLogs.length}
          </Badge>
        </button>
      )}

      <Sheet open={showToolLog} onOpenChange={setShowToolLog}>
        <SheetContent
          side="right"
          className="flex w-[400px] flex-col sm:max-w-[400px]"
        >
          <SheetHeader>
            <SheetTitle>AI Agent Tool Calls</SheetTitle>
            <SheetDescription className="sr-only">
              Tool call logs from the AI agent
            </SheetDescription>
            <StepIndicator currentStep={currentStep} />
          </SheetHeader>

          <div className="h-px bg-border" />

          <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
            {reversedLogs.map((log) => (
              <ToolLogItem key={log.id} log={log} />
            ))}
            {reversedLogs.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tool call 기록이 없습니다
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
