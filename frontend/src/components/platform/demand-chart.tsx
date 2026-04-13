"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import type { DemandPoint } from "@/types/platform";

interface DemandChartProps {
  readonly data: ReadonlyArray<DemandPoint>;
}

export function DemandChart({ data }: DemandChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-clover-900">
          <BarChart3 className="h-5 w-5 text-clover-600" />
          카테고리별 수요 vs 등록
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-clover-200 bg-clover-50/40 p-4 text-center text-sm text-clover-700">
            아직 카테고리별 수요 데이터가 부족합니다. 학습자 활동이 누적되면
            여기에 차트가 표시됩니다.
          </div>
        ) : (
          <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...data]}
              margin={{ top: 8, right: 12, bottom: 0, left: -16 }}
            >
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #D1FAE5",
                  fontSize: 12,
                  color: "#064E3B",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#065F46" }} />
              <Bar
                dataKey="searchVolume"
                name="검색량"
                fill="#34D399"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="enrollVolume"
                name="등록 수"
                fill="#059669"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500">
          검색량과 등록 수의 갭이 큰 카테고리는 콘텐츠 부족 또는 진입 장벽이
          높다는 신호입니다.
        </p>
      </CardContent>
    </Card>
  );
}
