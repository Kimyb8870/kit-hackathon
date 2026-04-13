"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForgettingCurvePoint } from "@/types/dashboard";

const ForgettingCurveChart = dynamic(
  () => import("./forgetting-curve-chart"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />,
  }
);

interface ForgettingCurveProps {
  readonly data: ReadonlyArray<ForgettingCurvePoint>;
}

export function ForgettingCurve({ data }: ForgettingCurveProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>망각 곡선</CardTitle>
      </CardHeader>
      <CardContent>
        <ForgettingCurveChart data={data} />
        <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-blue-500" />
            복습 시 기억 유지율
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-gray-400" />
            복습 없이 (이론 곡선)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
            복습 포인트
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
