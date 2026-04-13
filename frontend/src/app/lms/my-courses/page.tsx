import { redirect } from "next/navigation";

// Alias for the legacy `/lms/my-courses` path that qa-round-3 flagged as a 404.
// The canonical page lives at `/lms/my-classes` (matching the user-facing
// "마이클래스" navigation label). Server-side redirect avoids any client
// flash and is automatically a 308 in Next.js, so existing bookmarks survive.
export default function MyCoursesAliasPage(): never {
  redirect("/lms/my-classes");
}
