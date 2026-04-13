import Link from "next/link";
import { CourseCard } from "@/components/lms/course-card";
import {
  LMS_CATEGORIES,
  LMS_COURSES,
  type LmsCategory,
} from "@/lib/lms-mock-data";

interface CoursesPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const selected = (params.category as LmsCategory | undefined) ?? null;

  const filtered = selected
    ? LMS_COURSES.filter((c) => c.category === selected)
    : LMS_COURSES;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10">
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#8a8d92]">
            전체 강의
          </p>
          <h1 className="mt-1 text-[24px] font-bold text-[#1f1f1f]">
            {selected ?? "모든 카테고리"}
          </h1>
          <p className="mt-1 text-[12px] text-[#8a8d92]">
            총 {filtered.length}개의 강의
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/lms/courses"
          className={`rounded-full border px-4 py-1.5 text-[12px] transition-colors ${
            !selected
              ? "border-[#1f1f1f] bg-[#1f1f1f] text-white"
              : "border-[#e5e5e5] bg-white text-[#606060] hover:border-[#1f1f1f] hover:text-[#1f1f1f]"
          }`}
        >
          전체
        </Link>
        {LMS_CATEGORIES.map((cat) => {
          const active = selected === cat;
          return (
            <Link
              key={cat}
              href={`/lms/courses?category=${encodeURIComponent(cat)}`}
              className={`rounded-full border px-4 py-1.5 text-[12px] transition-colors ${
                active
                  ? "border-[#1f1f1f] bg-[#1f1f1f] text-white"
                  : "border-[#e5e5e5] bg-white text-[#606060] hover:border-[#1f1f1f] hover:text-[#1f1f1f]"
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {/* Course grid */}
      {filtered.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-[#e5e5e5] bg-white py-20 text-center">
          <p className="text-[14px] text-[#8a8d92]">
            해당 카테고리에 등록된 강의가 아직 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </main>
  );
}
