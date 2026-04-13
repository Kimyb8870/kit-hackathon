"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CalendarDays, MessageCircle, Store } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ChatContainer } from "@/components/chat/chat-container";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { EmbeddedLoginGate } from "@/components/shared/embedded-login-gate";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { useProfileStore } from "@/stores/profile-store";
import { useChatStore, type CourseContext } from "@/stores/chat-store";
import { useEmbeddedMode } from "@/hooks/use-embedded-mode";
import { useProfileHydration } from "@/hooks/use-profile-hydration";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getProfile } from "@/lib/api-client";

interface CourseContextChangeMessage {
  type: "COURSE_CONTEXT_CHANGE";
  courseId?: string;
  chapterNo?: number | string;
  clipNo?: number | string;
}

// Message posted by the host LMS frame (e.g. the "해볼 일" guide box on
// /lms/courses/{id}?demo=1) to auto-send a suggested prompt into the
// embedded Learner chat. Routed through chat-store.pendingAutoMessage so
// chat-container can flush it once it mounts.
interface AutoSendMessage {
  type: "CLOVER_AUTO_SEND_MESSAGE";
  text?: string;
}

function isCourseContextMessage(
  data: unknown
): data is CourseContextChangeMessage {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return obj.type === "COURSE_CONTEXT_CHANGE";
}

function isAutoSendMessage(data: unknown): data is AutoSendMessage {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return obj.type === "CLOVER_AUTO_SEND_MESSAGE";
}

function toIntOrNull(value: number | string | undefined): number | null {
  if (value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

type LearnerTab = "chat" | "schedule";

function isValidTab(value: string | null): value is LearnerTab {
  return value === "chat" || value === "schedule";
}

export function LearnerContent() {
  const isOnboarded = useProfileStore((s) => s.isOnboarded);
  const setProfile = useProfileStore((s) => s.setProfile);
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding);
  const profileHydrated = useProfileHydration();
  const setCourseContext = useChatStore((s) => s.setCourseContext);
  const setPendingAutoMessage = useChatStore((s) => s.setPendingAutoMessage);
  const pendingAutoMessage = useChatStore((s) => s.pendingAutoMessage);
  const { embedded, courseId, chapterNo, clipNo } = useEmbeddedMode();
  const { user, isLoading: authLoading } = useSupabaseUser();
  const lastContextKey = useRef<string | null>(null);

  // Track the server-profile fetch lifecycle so the onboarding modal can
  // stay hidden until we know whether a profile already exists on the
  // server. Without this, `isOnboarded === false` from a fresh
  // localStorage makes the modal flash open for the duration of the
  // fetch, only to dismiss itself when the server response arrives.
  const [profileFetchState, setProfileFetchState] = useState<
    "idle" | "loading" | "done"
  >("idle");

  // Hydrate the onboarding flag from the server. The local zustand store
  // only knows what was persisted to this browser's localStorage, so a
  // fresh device, incognito tab, or a store-version migration would
  // otherwise re-prompt the user even though their profile already lives
  // in the database. We trust the server: if a profile row exists for
  // this user, mirror it into the store and skip the modal.
  useEffect(() => {
    // No user yet (auth still loading or logged out) or embedded mode —
    // leave fetchState at its current value so the modal gate stays
    // closed. `!user` prevents a brief modal flash between the initial
    // render and the middleware redirect for logged-out visitors.
    if (!user || embedded) return;

    // Already onboarded locally: open the gate immediately, no fetch
    // needed. The modal will render with `open={false}`.
    if (isOnboarded) {
      setProfileFetchState("done");
      return;
    }

    let cancelled = false;
    setProfileFetchState("loading");

    void getProfile(user.id)
      .then((profile) => {
        if (cancelled) return;
        if (profile) {
          setProfile(profile);
          completeOnboarding();
        }
        setProfileFetchState("done");
      })
      .catch(() => {
        // Network error: leave the modal open so the user can re-enter
        // their answers. The next /chat call will retry the create.
        if (cancelled) return;
        setProfileFetchState("done");
      });

    return () => {
      cancelled = true;
    };
  }, [user, isOnboarded, embedded, setProfile, completeOnboarding]);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state lives in local React state — NOT derived from URL — because in
  // Next.js 16 + React 19 transitions, calling router.push/replace to the same
  // pathname (only query differs) inside a click handler chain gets deduped and
  // the URL never updates, leaving controlled-from-URL Tabs stuck. Local state
  // avoids the entire router round-trip. We seed once from the URL so deep
  // links from /dashboard (which redirects to /learner?tab=schedule) still
  // land on the schedule tab.
  const initialTab: LearnerTab = (() => {
    const raw = searchParams.get("tab");
    return isValidTab(raw) ? raw : "chat";
  })();
  const [activeTab, setActiveTab] = useState<LearnerTab>(initialTab);

  const switchTab = useCallback(
    (next: LearnerTab) => {
      setActiveTab(next);
      // Best-effort URL sync so reloads / shares preserve the tab. We do not
      // depend on this for the visual state — even if router.replace silently
      // no-ops, the tab will still switch via setActiveTab above.
      const params = new URLSearchParams(searchParams.toString());
      if (next === "chat") {
        params.delete("tab");
      } else {
        params.set("tab", next);
      }
      const query = params.toString();
      router.replace(query ? `/learner?${query}` : "/learner", {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  const handleTabChange = (next: unknown) => {
    if (typeof next !== "string" || !isValidTab(next)) return;
    switchTab(next);
  };

  const switchToChat = useCallback(() => {
    switchTab("chat");
  }, [switchTab]);

  // When another part of the app (e.g. study-schedule action buttons) queues
  // an auto-message for the learner chat, jump to the chat tab so the user
  // sees the response immediately. The chat-container is responsible for
  // actually sending the queued text once it mounts.
  useEffect(() => {
    if (embedded) return;
    if (pendingAutoMessage === null) return;
    if (activeTab === "chat") return;
    switchTab("chat");
  }, [embedded, pendingAutoMessage, activeTab, switchTab]);

  // Seed the chat store with the course context that arrived via the URL so
  // the first chat message already carries it.
  useEffect(() => {
    if (!embedded) return;
    if (!courseId) return;
    const next: CourseContext = {
      courseId,
      chapterNo,
      clipNo,
    };
    const key = `${courseId}|${chapterNo ?? ""}|${clipNo ?? ""}`;
    if (key === lastContextKey.current) return;
    lastContextKey.current = key;
    setCourseContext(next);
  }, [embedded, courseId, chapterNo, clipNo, setCourseContext]);

  // Listen for postMessage updates from the host LMS frame. Two event
  // shapes are accepted:
  //   1) COURSE_CONTEXT_CHANGE — updates the active course/chapter/clip so
  //      subsequent chat turns carry fresh context.
  //   2) CLOVER_AUTO_SEND_MESSAGE — queues a suggested prompt into the
  //      chat-store so chat-container flushes it the moment it is mounted.
  //      We intentionally queue here (and do not try to call sendMessage
  //      directly) so the normal `pendingAutoMessage` drain path handles
  //      streaming/dedupe/course-context wiring uniformly.
  useEffect(() => {
    if (!embedded) return;

    const handler = (event: MessageEvent) => {
      if (isCourseContextMessage(event.data)) {
        const incomingCourseId = event.data.courseId;
        if (typeof incomingCourseId !== "string" || incomingCourseId === "") {
          return;
        }
        const next: CourseContext = {
          courseId: incomingCourseId,
          chapterNo: toIntOrNull(event.data.chapterNo),
          clipNo: toIntOrNull(event.data.clipNo),
        };
        const key = `${next.courseId}|${next.chapterNo ?? ""}|${next.clipNo ?? ""}`;
        if (key === lastContextKey.current) return;
        lastContextKey.current = key;
        setCourseContext(next);
        return;
      }

      if (isAutoSendMessage(event.data)) {
        const text = event.data.text;
        if (typeof text !== "string" || text.trim() === "") return;
        // Read the latest course context straight from the store so the
        // prompt carries the structured pointer the backend needs. The
        // host COURSE_CONTEXT_CHANGE message is posted on iframe mount,
        // so by the time a user can click a suggestion chip the store is
        // already primed.
        const activeContext = useChatStore.getState().courseContext;
        const courseContext =
          activeContext && activeContext.courseId
            ? {
                course_id: activeContext.courseId,
                ...(activeContext.chapterNo !== null && {
                  chapter_no: activeContext.chapterNo,
                }),
                ...(activeContext.clipNo !== null && {
                  clip_no: activeContext.clipNo,
                }),
              }
            : undefined;
        setPendingAutoMessage({
          text,
          source: "other",
          ...(courseContext && { courseContext }),
        });
        return;
      }
    };

    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
    };
  }, [embedded, setCourseContext, setPendingAutoMessage]);

  // Clear the course context when this page is no longer in embedded mode so
  // it doesn't leak into a regular standalone session.
  useEffect(() => {
    if (embedded) return;
    lastContextKey.current = null;
    setCourseContext(null);
  }, [embedded, setCourseContext]);

  if (embedded) {
    // Embedded mode: no padding, no onboarding modal — the host frame already
    // owns the chrome and we trust it to provide context.
    if (authLoading) {
      return <div className="flex h-full min-h-0 flex-1 bg-white" />;
    }
    if (!user) {
      return (
        <EmbeddedLoginGate agentLabel="Learner Agent" agentEmoji="🌱" />
      );
    }
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
        <ChatContainer />
      </div>
    );
  }

  // Standalone mode: tab layout with persistent chat mount so switching to the
  // schedule tab (and back) never drops chat state or streaming events.
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-clover-100 bg-gradient-to-r from-clover-50/60 via-white to-emerald-50/60 px-4 py-2">
        <Link
          href="/lms/courses/550e8400-e29b-41d4-a716-446655440001?demo=1"
          className="group flex items-center justify-between rounded-lg border border-clover-200 bg-white px-3 py-1.5 transition-colors hover:border-clover-400"
        >
          <div className="flex items-center gap-2 text-xs">
            <Store className="h-3.5 w-3.5 text-clover-600" />
            <span className="font-semibold text-clover-800">
              EduMall 강의 페이지에서 iframe 임베드 뷰로 보기
            </span>
            <span className="hidden text-gray-500 sm:inline">
              · 학습자 컨텍스트 기반 Clover 튜터 체험
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-clover-600 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-1 flex-col gap-0"
      >
        <div className="border-b border-clover-100 bg-white px-4 py-2">
          <TabsList className="bg-clover-50/50">
            <TabsTrigger value="chat" className="gap-1.5 px-3">
              <MessageCircle className="h-4 w-4" />
              AI 튜터
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5 px-3">
              <CalendarDays className="h-4 w-4" />
              학습 일정
            </TabsTrigger>
          </TabsList>
        </div>

        {/*
          keepMounted: both panels stay in the DOM so tab switches never
          unmount the chat (preserves SSE stream + message state) nor
          re-fetch the dashboard. Base UI tags the inactive panel with
          `data-hidden`, and the Tailwind selector hides it visually.
        */}
        <TabsContent
          value="chat"
          keepMounted
          className="flex min-h-0 flex-1 flex-col data-[hidden]:hidden"
        >
          <ChatContainer />
        </TabsContent>

        <TabsContent
          value="schedule"
          keepMounted
          className="flex min-h-0 flex-1 flex-col overflow-y-auto data-[hidden]:hidden"
        >
          {user ? (
            <DashboardSection userId={user.id} onSwitchToChat={switchToChat} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              로그인이 필요합니다.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {profileHydrated && profileFetchState === "done" && (
        <OnboardingModal open={!isOnboarded} />
      )}
    </div>
  );
}
