"use client";

import { useEffect } from "react";
import { BookOpen } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { StatsSummary } from "@/components/dashboard/stats-summary";
import { StudySchedule } from "@/components/dashboard/study-schedule";
import { WeeklyPlan } from "@/components/dashboard/weekly-plan";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardSectionProps {
  readonly userId: string;
  readonly onSwitchToChat?: () => void;
}

/**
 * Embeddable dashboard view that takes a user_id from props instead of
 * the hardcoded MOCK_USER_ID. Used inside the Learner page's "학습 일정"
 * tab. The standalone /dashboard route now redirects here.
 */
export function DashboardSection({ userId, onSwitchToChat }: DashboardSectionProps) {
  const stats = useDashboardStore((s) => s.stats);
  const todaySchedule = useDashboardStore((s) => s.todaySchedule);
  const weeklyPlan = useDashboardStore((s) => s.weeklyPlan);
  const isLoading = useDashboardStore((s) => s.isLoading);
  const fetchDashboardData = useDashboardStore((s) => s.fetchDashboardData);
  const toggleScheduleItem = useDashboardStore((s) => s.toggleScheduleItem);

  useEffect(() => {
    if (!userId) return;
    void fetchDashboardData(userId);
  }, [userId, fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[380px] rounded-lg" />
        <Skeleton className="h-[200px] rounded-lg" />
      </div>
    );
  }

  const isEmpty =
    todaySchedule.length === 0 &&
    weeklyPlan.every((d) => d.totalItems === 0);

  if (isEmpty) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <div className="rounded-full bg-gradient-to-br from-clover-300/40 to-clover-500/30 p-4">
          <BookOpen className="h-8 w-8 text-clover-600" />
        </div>
        <h2 className="text-lg font-semibold">아직 학습 일정이 없습니다</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          AI 튜터와 대화를 시작해보세요! 학습 일정이 자동으로 생성됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">학습 대시보드</h1>
      <StatsSummary stats={stats} />
      <StudySchedule
        items={todaySchedule}
        onToggle={toggleScheduleItem}
        onSwitchToChat={onSwitchToChat}
      />
      <WeeklyPlan days={weeklyPlan} />
    </div>
  );
}
