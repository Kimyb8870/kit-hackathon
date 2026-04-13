"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LMS_CATEGORIES } from "@/lib/lms-mock-data";
import { LmsAuthButtons } from "@/components/lms/lms-auth-buttons";

const TOP_LINKS = [
  { href: "/lms/instructor-center", label: "강사센터" },
  { href: "/lms/operator-center", label: "운영자센터" },
  { href: "#", label: "고객센터" },
];

export function LmsHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#ececec] bg-white">
      {/* Top utility bar */}
      <div className="border-b border-[#f2f2f2] bg-[#fafafa]">
        <div className="mx-auto flex h-9 max-w-[1200px] items-center justify-end gap-4 px-4 text-[12px] text-[#8a8d92]">
          {TOP_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="transition-colors hover:text-[#454950]"
            >
              {l.label}
            </Link>
          ))}
          <span className="h-3 w-px bg-[#e5e5e5]" />
          <LmsAuthButtons />
        </div>
      </div>

      {/* Main header — logo + search + cta */}
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-8 px-4">
        <Link
          href="/lms"
          className="flex items-baseline gap-1 text-[26px] font-bold tracking-tight text-[#1f1f1f]"
        >
          <span>EduMall</span>
          <span className="text-[10px] font-medium text-[#8a8d92]">
            에듀몰
          </span>
        </Link>

        <div className="flex flex-1 items-center">
          <div className="flex h-11 w-full max-w-[520px] items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#fafafa] px-5">
            <SearchIcon className="h-4 w-4 text-[#8a8d92]" />
            <input
              type="text"
              disabled
              placeholder="배우고 싶은 분야, 강사, 키워드를 검색해 보세요"
              className="flex-1 bg-transparent text-[13px] text-[#1f1f1f] outline-none placeholder:text-[#a8abb0]"
            />
          </div>
        </div>

        <nav className="flex items-center gap-6 text-[13px] text-[#454950]">
          <Link href="/lms/courses" className="hover:text-[#1f1f1f]">
            전체 강의
          </Link>
          <Link href="#" className="hover:text-[#1f1f1f]">
            장바구니
          </Link>
          <Link href="/lms/my-classes" className="hover:text-[#1f1f1f]">
            마이클래스
          </Link>
        </nav>
      </div>

      {/* Category strip */}
      <div className="border-t border-[#f2f2f2]">
        <div className="lms-scroll-x mx-auto flex h-12 max-w-[1200px] items-center gap-1 overflow-x-auto px-2">
          {LMS_CATEGORIES.map((cat) => {
            const href = `/lms/courses?category=${encodeURIComponent(cat)}`;
            const active = pathname?.startsWith("/lms/courses");
            return (
              <Link
                key={cat}
                href={href}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] transition-colors ${
                  active
                    ? "text-[#1f1f1f] hover:bg-[#f2f2f2]"
                    : "text-[#606060] hover:bg-[#f2f2f2] hover:text-[#1f1f1f]"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
