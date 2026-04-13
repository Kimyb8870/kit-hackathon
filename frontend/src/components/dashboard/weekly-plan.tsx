"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { WeeklyPlanDay } from "@/types/dashboard";

interface WeeklyPlanProps {
  readonly days: ReadonlyArray<WeeklyPlanDay>;
}

const MAX_BAR_HEIGHT = 80;

function getBarHeight(totalItems: number, maxItems: number): number {
  if (maxItems === 0) return 0;
  return Math.max(8, (totalItems / maxItems) * MAX_BAR_HEIGHT);
}

function getCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function WeeklyPlan({ days }: WeeklyPlanProps) {
  const maxItems = Math.max(...days.map((d) => d.totalItems), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          이번 주 학습 계획
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          {days.map((day) => {
            const barHeight = getBarHeight(day.totalItems, maxItems);
            const completionRate = getCompletionRate(
              day.completedItems,
              day.totalItems
            );
            const isPast =
              !day.isToday &&
              days.findIndex((d) => d.isToday) > days.indexOf(day);

            return (
              <div
                key={day.day}
                className="flex flex-1 flex-col items-center gap-2"
              >
                {/* Completion rate for past days */}
                <span className="text-xs text-muted-foreground tabular-nums h-4">
                  {isPast && day.totalItems > 0
                    ? `${completionRate}%`
                    : day.isToday && day.totalItems > 0
                    ? `${day.completedItems}/${day.totalItems}`
                    : ""}
                </span>

                {/* Bar */}
                <div
                  className="relative w-full max-w-[40px] rounded-t-md"
                  style={{ height: `${barHeight}px` }}
                >
                  {/* Background bar (total) */}
                  <div
                    className={`absolute inset-0 rounded-t-md ${
                      day.isToday
                        ? "bg-blue-500/20 dark:bg-blue-500/30"
                        : "bg-muted"
                    }`}
                  />
                  {/* Filled bar (completed) */}
                  {day.totalItems > 0 && (
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all ${
                        day.isToday
                          ? "bg-blue-500"
                          : isPast
                          ? "bg-muted-foreground/50"
                          : "bg-muted-foreground/20"
                      }`}
                      style={{
                        height: `${(day.completedItems / day.totalItems) * 100}%`,
                      }}
                    />
                  )}
                </div>

                {/* Day label */}
                <div
                  className={`flex flex-col items-center rounded-md px-2 py-1 ${
                    day.isToday
                      ? "bg-blue-500/10 ring-1 ring-blue-500/30 dark:bg-blue-500/20"
                      : ""
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      day.isToday
                        ? "text-blue-600 dark:text-blue-400"
                        : isPast
                        ? "text-muted-foreground"
                        : ""
                    }`}
                  >
                    {day.day}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {day.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
            오늘
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted-foreground/50" />
            완료
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted" />
            예정
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
