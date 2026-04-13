import { redirect } from "next/navigation";

/**
 * The standalone /dashboard route has been folded into /learner as its
 * "학습 일정" tab. Keep this route so existing bookmarks and proxy.ts's
 * protected prefix continue to work.
 */
export default function DashboardPage() {
  redirect("/learner?tab=schedule");
}
