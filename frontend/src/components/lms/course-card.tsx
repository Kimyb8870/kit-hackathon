import Link from "next/link";
import { type LmsCourse, formatPrice } from "@/lib/lms-mock-data";

interface CourseCardProps {
  course: LmsCourse;
}

export function CourseCard({ course }: CourseCardProps) {
  const discount = course.originalPrice
    ? Math.round((1 - course.price / course.originalPrice) * 100)
    : 0;

  return (
    <Link
      href={`/lms/courses/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-[10px] border border-[#ececec] bg-white transition-all hover:-translate-y-0.5 hover:border-[#d8d8d8] hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]"
    >
      {/* Thumbnail */}
      <div
        className={`relative aspect-[16/10] w-full bg-gradient-to-br ${course.thumbnailGradient}`}
      >
        {/* Faux logo overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[40px] font-black tracking-tighter text-white/15">
            EduMall
          </span>
        </div>

        {/* Badges */}
        {course.badges && course.badges.length > 0 && (
          <div className="absolute left-3 top-3 flex gap-1">
            {course.badges.map((b) => (
              <span
                key={b}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  b === "BEST"
                    ? "bg-[#1f1f1f] text-white"
                    : b === "HOT"
                      ? "bg-white text-[#1f1f1f]"
                      : "bg-[#454950] text-white"
                }`}
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {/* Category badge */}
        <div className="absolute right-3 top-3">
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            {course.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#1f1f1f] group-hover:text-black">
          {course.title}
        </h3>
        <p className="text-[12px] text-[#606060]">{course.instructor}</p>

        <div className="flex items-center gap-2 text-[11px] text-[#8a8d92]">
          <span className="flex items-center gap-0.5">
            <StarIcon className="h-3 w-3 text-[#454950]" />
            {course.rating.toFixed(1)}
          </span>
          <span>·</span>
          <span>{course.studentCount.toLocaleString("ko-KR")}명</span>
          <span>·</span>
          <span>{course.totalHours}시간</span>
        </div>

        <div className="mt-auto pt-2">
          {discount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold text-[#1f1f1f]">
                {discount}%
              </span>
              <span className="text-[11px] text-[#a8abb0] line-through">
                {formatPrice(course.originalPrice!)}원
              </span>
            </div>
          )}
          <div className="text-[15px] font-bold text-[#1f1f1f]">
            {formatPrice(course.price)}원
          </div>
        </div>
      </div>
    </Link>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}
