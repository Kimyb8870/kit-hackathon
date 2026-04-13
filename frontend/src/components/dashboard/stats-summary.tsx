import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types/dashboard";
import { Flame, GraduationCap, Target } from "lucide-react";

interface StatsSummaryProps {
  readonly stats: DashboardStats;
}

const STAT_ITEMS = [
  {
    key: "todayGoal",
    label: "오늘 학습 목표",
    format: (stats: DashboardStats) =>
      `${stats.todayCompleted}/${stats.todayTotal}`,
    subtitle: (stats: DashboardStats) => {
      if (stats.todayTotal === 0) return "일정 없음";
      if (stats.todayCompleted === stats.todayTotal) return "완료!";
      return "완료";
    },
    icon: Target,
    color: "text-blue-500",
  },
  {
    key: "streak",
    label: "연속 학습",
    format: (stats: DashboardStats) => `${stats.streakDays}일`,
    subtitle: () => "",
    icon: Flame,
    color: "text-orange-500",
  },
  {
    key: "mastered",
    label: "마스터 개념",
    format: (stats: DashboardStats) => `${stats.masteredConcepts}개`,
    subtitle: () => "",
    icon: GraduationCap,
    color: "text-green-500",
  },
] as const;

export function StatsSummary({ stats }: StatsSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STAT_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = item.format(stats);
        const subtitle = item.subtitle(stats);
        return (
          <Card key={item.key}>
            <CardContent className="flex items-center gap-3">
              <Icon className={`h-8 w-8 ${item.color}`} />
              <div>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-3xl font-bold">{value}</p>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
