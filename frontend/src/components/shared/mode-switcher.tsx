"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout, Leaf, TreePine } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  {
    href: "/learner",
    emoji: "🌱",
    label: "Learner",
    icon: Sprout,
    tagline: "학습 성공을 위한 AI",
    accent: "from-clover-300 to-clover-500",
    ring: "ring-clover-200",
    text: "text-clover-700",
  },
  {
    href: "/instructor",
    emoji: "🍃",
    label: "Instructor",
    icon: Leaf,
    tagline: "강사 지원 AI",
    accent: "from-clover-400 to-clover-600",
    ring: "ring-clover-300",
    text: "text-clover-800",
  },
  {
    href: "/platform",
    emoji: "🌿",
    label: "Platform",
    icon: TreePine,
    tagline: "비즈니스 인사이트 AI",
    accent: "from-clover-500 to-clover-700",
    ring: "ring-clover-400",
    text: "text-clover-900",
  },
] as const;

interface ModeSwitcherProps {
  readonly compact?: boolean;
}

export function ModeSwitcher({ compact = false }: ModeSwitcherProps) {
  const pathname = usePathname();

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 rounded-full border border-clover-100 bg-white p-1 shadow-sm">
        {MODES.map(({ href, label, emoji }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "bg-clover-500 text-white shadow"
                  : "text-clover-700 hover:bg-clover-50"
              )}
            >
              <span aria-hidden>{emoji}</span>
              {label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {MODES.map(({ href, label, emoji, tagline, accent, ring, text }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-clover-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
              active && `ring-2 ${ring}`
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 -top-12 h-24 bg-gradient-to-br opacity-15 blur-2xl transition-opacity group-hover:opacity-25",
                accent
              )}
            />
            <div className="relative flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {emoji}
              </span>
              <div className="flex flex-col">
                <span className={cn("text-sm font-semibold", text)}>
                  {label} Agent
                </span>
                <span className="text-xs text-gray-500">{tagline}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
