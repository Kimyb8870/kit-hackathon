"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getProfile } from "@/lib/api-client";
import { getCourseById, type LmsCourse } from "@/lib/lms-mock-data";
import { CourseCard } from "@/components/lms/course-card";

type LoadStatus = "loading" | "ready" | "error";

interface ResolvedEnrollment {
  readonly courseId: string;
  readonly course: LmsCourse | null;
}

export default function MyClassesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useSupabaseUser();
  const [enrollments, setEnrollments] = useState<ReadonlyArray<ResolvedEnrollment>>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/lms/my-classes");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    void getProfile(user.id)
      .then((profile) => {
        if (cancelled) return;
        if (!profile) {
          setEnrollments([]);
          setStatus("ready");
          return;
        }
        const resolved: ReadonlyArray<ResolvedEnrollment> = profile.enrolledCourses.map(
          (courseId) => ({
            courseId,
            course: getCourseById(courseId) ?? null,
          })
        );
        setEnrollments(resolved);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "알 수 없는 오류";
        setErrorMessage(message);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10">
      <header className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#8a8d92]">
          MY CLASSES
        </p>
        <h1 className="mt-1 text-[24px] font-bold text-[#1f1f1f]">마이클래스</h1>
        <p className="mt-1 text-[13px] text-[#606060]">
          내가 수강 중인 강의를 한 곳에서 확인하고 이어서 학습하세요.
        </p>
      </header>

      {status === "loading" || authLoading ? (
        <MyClassesSkeleton />
      ) : status === "error" ? (
        <ErrorState message={errorMessage} />
      ) : enrollments.length === 0 ? (
        <EmptyState />
      ) : (
        <EnrolledGrid enrollments={enrollments} />
      )}
    </main>
  );
}

function MyClassesSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      aria-busy="true"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[10px] border border-[#ececec] bg-white"
        >
          <div className="aspect-[16/10] w-full animate-pulse bg-[#f2f2f2]" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-3/4 animate-pulse rounded bg-[#f2f2f2]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#f2f2f2]" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#f2f2f2]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string | null }) {
  return (
    <div className="rounded-[10px] border border-[#ececec] bg-white p-8 text-center">
      <p className="text-[14px] font-semibold text-[#1f1f1f]">
        수강 정보를 불러오지 못했어요.
      </p>
      {message && (
        <p className="mt-2 text-[12px] text-[#8a8d92]">{message}</p>
      )}
      <Link
        href="/lms"
        className="mt-4 inline-block rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-[12px] font-medium text-[#454950] transition-colors hover:border-[#1f1f1f] hover:text-[#1f1f1f]"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[10px] border border-dashed border-[#dcdcdc] bg-[#fafafa] p-12 text-center">
      <p className="text-[15px] font-semibold text-[#1f1f1f]">
        아직 수강 중인 강의가 없어요.
      </p>
      <p className="mt-2 text-[12px] text-[#8a8d92]">
        관심 있는 강의를 찾아 ‘바로 수강하기’를 눌러 보세요.
      </p>
      <Link
        href="/lms/courses"
        className="mt-5 inline-block rounded-full bg-clover-600 px-6 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-clover-700"
      >
        전체 강의 보러 가기 →
      </Link>
    </div>
  );
}

interface EnrolledGridProps {
  readonly enrollments: ReadonlyArray<ResolvedEnrollment>;
}

function EnrolledGrid({ enrollments }: EnrolledGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {enrollments.map((entry) =>
        entry.course ? (
          <CourseCard key={entry.courseId} course={entry.course} />
        ) : (
          <MissingCourseCard key={entry.courseId} courseId={entry.courseId} />
        )
      )}
    </div>
  );
}

function MissingCourseCard({ courseId }: { courseId: string }) {
  return (
    <Link
      href={`/lms/courses/${courseId}`}
      className="flex flex-col overflow-hidden rounded-[10px] border border-dashed border-[#dcdcdc] bg-[#fafafa] p-5 transition-colors hover:border-[#1f1f1f]"
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#a8abb0]">
        Catalog 외 강의
      </p>
      <p className="mt-2 line-clamp-2 text-[13px] font-semibold text-[#454950]">
        {courseId}
      </p>
      <p className="mt-auto pt-4 text-[11px] text-[#8a8d92]">
        강의 페이지로 이동 →
      </p>
    </Link>
  );
}
