"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Sparkles, ArrowRight } from "lucide-react";
import type { PromotionSuggestion as PromotionSuggestionType } from "@/types/platform";

interface PromotionSuggestionProps {
  readonly suggestions: ReadonlyArray<PromotionSuggestionType>;
}

export function PromotionSuggestion({ suggestions }: PromotionSuggestionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-clover-900">
          <Megaphone className="h-5 w-5 text-clover-600" />
          AI 프로모션 / 신규 강의 제안
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.length === 0 && (
          <p className="rounded-xl border border-dashed border-clover-200 bg-clover-50/40 p-4 text-sm text-clover-700">
            아직 추천할 프로모션이 없습니다. 학습자 데이터가 누적되면 AI가
            타깃별 캠페인을 자동으로 제안합니다.
          </p>
        )}
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-clover-100 bg-gradient-to-br from-clover-50/60 to-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-clover-600">
                  타깃 · {s.targetSegment}
                </span>
                <h3 className="mt-1 flex items-center gap-2 text-base font-bold text-clover-900">
                  <Sparkles className="h-4 w-4 text-clover-500" />
                  {s.title}
                </h3>
              </div>
              <Badge className="border border-clover-300 bg-white text-clover-700">
                {s.expectedLift}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              {s.rationale}
            </p>
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="border-clover-200 text-clover-700 hover:bg-clover-50"
              >
                상세 보기
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
