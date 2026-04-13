"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import type { StruggleLearner } from "@/types/instructor";

interface StruggleListProps {
  readonly learners: ReadonlyArray<StruggleLearner>;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / (60 * 1000));
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.round(hours / 24);
  return `${days}일 전`;
}

function masteryColor(level: number): string {
  if (level < 0.4) return "bg-red-100 text-red-700 ring-red-200";
  if (level < 0.6) return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-clover-100 text-clover-700 ring-clover-200";
}

export function StruggleList({ learners }: StruggleListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-clover-900">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          어려움을 겪는 학습자
          <Badge className="ml-2 border border-clover-100 bg-clover-50 text-clover-700">
            {learners.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {learners.length === 0 && (
          <p className="rounded-xl border border-dashed border-clover-200 bg-clover-50/40 p-4 text-sm text-clover-700">
            아직 학생 활동 데이터가 부족합니다. 학습자가 퀴즈를 풀거나 질문을
            남기면 어려움을 겪는 영역이 여기에 표시됩니다.
          </p>
        )}
        {learners.map((learner) => (
          <div
            key={`${learner.userId}-${learner.conceptId}`}
            className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:border-clover-200 hover:bg-clover-50/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-clover-900">
                  {learner.displayName}
                </span>
                <span className="text-xs text-gray-500">
                  · {learner.courseTitle}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {learner.conceptTitle} —{" "}
                <span className="text-red-600">
                  퀴즈 {learner.failedQuizzes}회 실패
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`ring-1 ${masteryColor(learner.masteryLevel)}`}
              >
                숙련도 {Math.round(learner.masteryLevel * 100)}%
              </Badge>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {formatRelative(learner.lastActiveAt)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
