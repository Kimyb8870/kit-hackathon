"use client";

import { useEffect, useState } from "react";

interface UseSteppedProgressOptions {
  readonly loading: boolean;
  readonly totalSteps: number;
  readonly intervalMs?: number;
}

/**
 * Drives a visual stepper while an async operation is in flight.
 *
 * Behavior:
 *   - While `loading`, advances `currentStep` every `intervalMs`
 *     but stops one short of the last step so the final "completed"
 *     state is reserved for real data arrival.
 *   - When `loading` flips to false, jumps straight to `totalSteps`
 *     to mark all steps as completed.
 */
export function useSteppedProgress({
  loading,
  totalSteps,
  intervalMs = 1200,
}: UseSteppedProgressOptions): number {
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    if (!loading) {
      setCurrentStep(totalSteps);
      return;
    }

    setCurrentStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step >= totalSteps - 1) {
        setCurrentStep(totalSteps - 1);
        clearInterval(interval);
      } else {
        setCurrentStep(step);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [loading, totalSteps, intervalMs]);

  return currentStep;
}
