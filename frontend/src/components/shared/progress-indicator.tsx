"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgressStep {
  readonly icon: string;
  readonly label: string;
  readonly description: string;
}

interface ProgressIndicatorProps {
  readonly steps: ReadonlyArray<ProgressStep>;
  readonly currentStep: number;
  readonly compact?: boolean;
  readonly title?: string;
}

type StepState = "pending" | "active" | "completed";

function getStepState(index: number, currentStep: number): StepState {
  if (index < currentStep) return "completed";
  if (index === currentStep) return "active";
  return "pending";
}

/**
 * Vertical progress indicator used while dashboards are loading.
 * Shows a list of staged progress messages with spinner / checkmark / muted states.
 * Pure visual effect — step advancement is driven by the parent via `currentStep`.
 */
export function ProgressIndicator({
  steps,
  currentStep,
  compact = false,
  title,
}: ProgressIndicatorProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-clover-100 bg-gradient-to-b from-clover-50/60 via-white to-white shadow-sm",
        compact ? "p-4" : "p-6 sm:p-8",
      )}
      role="status"
      aria-live="polite"
    >
      {title ? (
        <div
          className={cn(
            "mb-4 flex items-center gap-2 font-semibold text-clover-900",
            compact ? "text-sm" : "text-base",
          )}
        >
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full bg-clover-500/10 text-clover-600",
              compact ? "h-6 w-6" : "h-7 w-7",
            )}
          >
            <Loader2
              className={cn(
                "animate-spin",
                compact ? "h-3.5 w-3.5" : "h-4 w-4",
              )}
            />
          </span>
          {title}
        </div>
      ) : null}

      <ol className={cn("relative", compact ? "space-y-3" : "space-y-4")}>
        {steps.map((step, index) => {
          const state = getStepState(index, currentStep);
          const isLast = index === steps.length - 1;

          return (
            <li key={`${step.label}-${index}`} className="relative flex gap-3">
              {/* Vertical connector line */}
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[15px] top-8 w-px",
                    compact ? "h-[calc(100%-12px)]" : "h-[calc(100%-8px)]",
                    state === "completed" ? "bg-clover-300" : "bg-gray-200",
                  )}
                />
              ) : null}

              {/* Status dot */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 transition-colors",
                    compact ? "h-8 w-8 text-xs" : "h-8 w-8 text-sm",
                    state === "completed" &&
                      "border-clover-500 bg-clover-500 text-white",
                    state === "active" &&
                      "border-clover-500 bg-white text-clover-600 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]",
                    state === "pending" &&
                      "border-gray-200 bg-white text-gray-400",
                  )}
                >
                  {state === "completed" ? (
                    <Check
                      className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
                      strokeWidth={3}
                    />
                  ) : state === "active" ? (
                    <Loader2
                      className={cn(
                        "animate-spin",
                        compact ? "h-3.5 w-3.5" : "h-4 w-4",
                      )}
                    />
                  ) : (
                    <span aria-hidden="true">{step.icon}</span>
                  )}
                </div>
              </div>

              {/* Text block */}
              <div className={cn("flex-1 pb-1", compact ? "pt-0.5" : "pt-1")}>
                <div
                  className={cn(
                    "flex items-center gap-1.5 font-semibold transition-colors",
                    compact ? "text-xs" : "text-sm",
                    state === "active" && "text-clover-900",
                    state === "completed" && "text-clover-700",
                    state === "pending" && "text-gray-400",
                  )}
                >
                  {state !== "completed" && state !== "active" ? null : (
                    <span aria-hidden="true">{step.icon}</span>
                  )}
                  <span>{step.label}</span>
                </div>
                <p
                  className={cn(
                    "mt-0.5 transition-colors",
                    compact ? "text-[11px] leading-snug" : "text-xs",
                    state === "active" && "text-gray-600",
                    state === "completed" && "text-gray-500",
                    state === "pending" && "text-gray-300",
                  )}
                >
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
