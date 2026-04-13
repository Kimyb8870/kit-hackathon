"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ForgettingCurvePoint } from "@/types/dashboard";

interface ForgettingCurveChartProps {
  readonly data: ReadonlyArray<ForgettingCurvePoint>;
}

interface CustomTooltipProps {
  readonly active?: boolean;
  readonly payload?: ReadonlyArray<{
    readonly name: string;
    readonly value: number;
    readonly color: string;
  }>;
  readonly label?: number;
}

const REVIEW_DAYS = new Set([1, 3, 7, 14, 21]);

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const isReviewDay = REVIEW_DAYS.has(label ?? 0);
  const withReview = payload.find((p) => p.name === "retentionWithReview");

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">Day {label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name === "retentionWithReview"
            ? "복습 시"
            : "복습 없이"}
          : {entry.value.toFixed(1)}%
        </p>
      ))}
      {isReviewDay && withReview && (
        <p className="mt-1 text-xs font-medium text-blue-500">
          복습 완료, 정답률 {Math.round(withReview.value)}%
        </p>
      )}
    </div>
  );
}

function renderDot(props: {
  cx?: number;
  cy?: number;
  payload?: ForgettingCurvePoint;
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload || !REVIEW_DAYS.has(payload.day)) {
    return <g />;
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#3b82f6"
      stroke="#fff"
      strokeWidth={2}
    />
  );
}

export default function ForgettingCurveChart({
  data,
}: ForgettingCurveChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={[...data]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorWithReview" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(v: number) => `${v}일`}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="retentionWithout"
          stroke="#9ca3af"
          fill="#9ca3af"
          fillOpacity={0.1}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          name="retentionWithout"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="retentionWithReview"
          stroke="#3b82f6"
          fill="url(#colorWithReview)"
          strokeWidth={2}
          name="retentionWithReview"
          dot={renderDot}
          activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
