"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuizInlineProps {
  readonly question: string;
  readonly options: readonly string[];
  readonly correctAnswer: number;
  readonly conceptId: string;
  readonly explanation?: string;
  readonly onSubmit: (result: {
    readonly conceptId: string;
    readonly isCorrect: boolean;
    readonly responseTimeMs: number;
  }) => void;
}

const LABELS = ["A", "B", "C", "D"] as const;

export function QuizInline({
  question,
  options,
  correctAnswer,
  conceptId,
  explanation,
  onSubmit,
}: QuizInlineProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const mountTimeRef = useRef(Date.now());

  const answered = selectedAnswer !== null;

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
    const responseTimeMs = Date.now() - mountTimeRef.current;
    const isCorrect = index === correctAnswer;
    onSubmit({ conceptId, isCorrect, responseTimeMs });
  };

  return (
    <Card className="my-2">
      <CardContent className="space-y-3">
        <p className="font-medium">{question}</p>
        <div className="space-y-2">
          {options.map((option, index) => {
            const isCorrectOption = index === correctAnswer;
            const isSelectedOption = index === selectedAnswer;

            return (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  "h-auto w-full justify-start whitespace-normal py-2 text-left",
                  answered &&
                    isCorrectOption &&
                    "border-green-500 bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-950 dark:text-green-300",
                  answered &&
                    isSelectedOption &&
                    !isCorrectOption &&
                    "border-red-500 bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-950 dark:text-red-300"
                )}
                onClick={() => handleSelect(index)}
                disabled={answered}
              >
                <span className="mr-2 font-bold">{LABELS[index]}.</span>
                {option}
              </Button>
            );
          })}
        </div>
        {answered && (
          <div
            className={cn(
              "rounded-lg p-3 text-sm",
              selectedAnswer === correctAnswer
                ? "bg-green-50 dark:bg-green-950"
                : "bg-red-50 dark:bg-red-950"
            )}
          >
            <p className="font-medium">
              {selectedAnswer === correctAnswer ? "정답!" : "오답"}
            </p>
            {explanation && (
              <p className="mt-1 text-muted-foreground">{explanation}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
