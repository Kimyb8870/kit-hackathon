"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp } from "lucide-react";
import type { TrendItem } from "@/types/platform";

interface TrendCardProps {
  readonly trends: ReadonlyArray<TrendItem>;
}

export function TrendCard({ trends }: TrendCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-clover-900">
          <Flame className="h-5 w-5 text-orange-500" />
          시장 트렌드 모니터링
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {trends.length === 0 && (
          <p className="rounded-xl border border-dashed border-clover-200 bg-clover-50/40 p-4 text-sm text-clover-700">
            아직 시장 트렌드 신호가 충분하지 않습니다. 학습자 활동이 누적되면
            급상승 키워드가 여기에 표시됩니다.
          </p>
        )}
        {trends.map((trend) => (
          <div
            key={trend.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-clover-100 bg-white px-4 py-3 transition-colors hover:bg-clover-50/40"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-clover-900">
                {trend.keyword}
              </span>
              <span className="text-xs text-gray-500">
                보유 강의 {trend.relatedCourses}개 · 출처 {trend.source}
              </span>
            </div>
            <Badge className="border border-clover-200 bg-clover-50 text-clover-700">
              <TrendingUp className="mr-1 h-3 w-3" />+{trend.weeklyGrowth.toFixed(1)}%
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
