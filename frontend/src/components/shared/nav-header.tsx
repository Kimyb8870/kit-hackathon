"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Presentation, BarChart3, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmbeddedMode } from "@/hooks/use-embedded-mode";
import { UserMenu } from "@/components/shared/user-menu";

const NAV_ITEMS = [
  {
    href: "/learner",
    label: "Learner",
    icon: GraduationCap,
    description: "학습자 AI",
  },
  {
    href: "/instructor",
    label: "Instructor",
    icon: Presentation,
    description: "강사 AI",
  },
  {
    href: "/platform",
    label: "Platform",
    icon: BarChart3,
    description: "플랫폼 AI",
  },
  {
    href: "/lms",
    label: "LMS 체험",
    icon: Store,
    description: "EduMall × Clover 통합 데모",
  },
] as const;

export function NavHeader() {
  const pathname = usePathname();
  const { embedded } = useEmbeddedMode();

  // LMS routes use their own header (EduMall branding) — skip Clover nav.
  if (pathname?.startsWith("/lms")) {
    return null;
  }

  // Embedded mode (e.g. iframe inside a host LMS) hides the Clover nav so the
  // host owns the chrome.
  if (embedded) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-clover-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="container flex h-16 items-center px-4">
        <Link
          href="/"
          className="mr-8 flex items-center gap-2 text-base font-semibold tracking-tight text-clover-900"
        >
          <span
            aria-hidden
            className="text-xl leading-none drop-shadow-[0_1px_0_rgba(16,185,129,0.25)]"
          >
            🍀
          </span>
          <span className="bg-gradient-to-r from-clover-700 to-clover-500 bg-clip-text text-transparent">
            Clover
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-all",
                  active
                    ? "bg-clover-50 font-semibold text-clover-700 ring-1 ring-clover-200"
                    : "font-medium text-gray-500 hover:bg-clover-50/60 hover:text-clover-700"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          <span className="hidden items-center gap-1 rounded-full bg-clover-50 px-2 py-1 font-medium text-clover-700 ring-1 ring-clover-100 lg:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-clover-500" />
            3-Agent Orchestrator
          </span>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
