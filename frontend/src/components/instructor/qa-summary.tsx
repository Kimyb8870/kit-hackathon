"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircleQuestion } from "lucide-react";
import type { QASummary as QASummaryItem } from "@/types/instructor";

interface QASummaryProps {
  readonly items: ReadonlyArray<QASummaryItem>;
}

export function QASummary({ items }: QASummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-clover-900">
          <MessageCircleQuestion className="h-5 w-5 text-clover-600" />
          자주 묻는 질문 요약
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-clover-200 bg-clover-50/40 p-4 text-sm text-clover-700">
            아직 자주 묻는 질문 데이터가 없습니다. 학습자가 AI 튜터에 질문을
            남기면 빈도 높은 항목과 답변 초안이 여기에 표시됩니다.
          </p>
        )}
        {items.map((item) => (
          <details
            key={item.id}
            className="group rounded-xl border border-clover-100 bg-white open:border-clover-300 open:shadow-sm"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <div className="flex flex-col">
                <span className="font-medium text-clover-900">
                  {item.question}
                </span>
                <span className="mt-1 text-xs text-gray-500">
                  Concept: {item.conceptId}
                </span>
              </div>
              <Badge className="shrink-0 border border-clover-200 bg-clover-50 text-clover-700">
                질문 {item.askedCount}회
              </Badge>
            </summary>
            <div className="border-t border-clover-100 bg-clover-50/40 p-4 text-sm leading-relaxed text-gray-700">
              <span className="block text-xs font-semibold uppercase tracking-wider text-clover-700">
                AI 답변 초안
              </span>
              <p className="mt-1">{item.suggestedAnswer}</p>
            </div>
          </details>
        ))}
      </CardContent>
    </Card>
  );
}
