"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookMarked, TrendingDown, Users } from "lucide-react";
import type { ContentGap } from "@/types/instructor";

interface ContentGapCardProps {
  readonly gaps: ReadonlyArray<ContentGap>;
}

export function ContentGapCard({ gaps }: ContentGapCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-clover-900">
          <BookMarked className="h-5 w-5 text-clover-600" />
          콘텐츠 갭 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {gaps.length === 0 && (
          <p className="rounded-xl border border-dashed border-clover-200 bg-clover-50/40 p-4 text-sm text-clover-700">
            아직 콘텐츠 갭 신호가 감지되지 않았습니다. 학습자의 질문이 일정량
            누적되면 보충이 필요한 개념이 자동으로 드러납니다.
          </p>
        )}
        {gaps.map((gap) => (
          <div
            key={gap.conceptId}
            className="rounded-xl border border-clover-100 bg-clover-50/40 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-clover-900">
                  {gap.conceptTitle}
                </h3>
                <p className="text-xs text-gray-500">{gap.courseTitle}</p>
              </div>
              <Badge className="border border-amber-200 bg-amber-50 text-amber-700">
                <TrendingDown className="mr-1 h-3 w-3" />
                평균 숙련도 {Math.round(gap.avgMastery * 100)}%
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-clover-700">
              <Users className="h-3 w-3" />
              영향 받은 학습자 {gap.affectedLearners}명
            </div>
            <p className="mt-3 rounded-lg border border-clover-100 bg-white p-3 text-sm leading-relaxed text-gray-700">
              <span className="font-semibold text-clover-700">💡 개선 제안 </span>
              {gap.suggestion}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
