"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ReviewItem } from "@/types/dashboard";

interface ReviewTimelineProps {
  readonly items: ReadonlyArray<ReviewItem>;
}

function formatTimeUntil(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return "지금";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}시간 후`;
  return `${minutes}분 후`;
}

export function ReviewTimeline({ items }: ReviewTimelineProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>오늘 복습할 개념</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            오늘 복습할 개념이 없습니다
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.conceptId}
            className="flex items-center gap-4 rounded-lg border p-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.clipReference}</p>
              <p className="text-sm text-muted-foreground truncate">
                {item.courseTitle} &middot; {formatTimeUntil(item.nextReviewAt)}
              </p>
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">기억 유지율</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {Math.round(item.masteryLevel * 100)}%
                  </span>
                </div>
                <Progress value={Math.round(item.masteryLevel * 100)} />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/chat")}
              className="shrink-0"
            >
              복습하기
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
