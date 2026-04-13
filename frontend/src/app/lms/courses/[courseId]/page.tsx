import { notFound } from "next/navigation";
import { CourseDetailClient } from "@/components/lms/course-detail-client";
import { getCourseById } from "@/lib/lms-mock-data";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (!course) {
    notFound();
  }

  return <CourseDetailClient course={course} />;
}
