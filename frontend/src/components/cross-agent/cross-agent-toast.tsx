"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { fetchEvents } from "@/lib/api-client";
import {
  agentPalette,
  describeEvent,
  isDebugEvent,
} from "./event-describer";

interface CrossAgentToastProps {
  readonly forRole: "learner" | "instructor" | "platform" | "all";
  readonly pollIntervalMs?: number;
}

// Tuned for the live demo: polling slows to 8s so the judges aren't watching
// a firehose, toasts self-dismiss after 7s, and we cap concurrent toasts at
// 3 (controlled via <Toaster visibleToasts={3} /> in the root layout).
const DEFAULT_POLL_MS = 8000;
const TOAST_TTL_MS = 7000;

export function CrossAgentToast({
  forRole,
  pollIntervalMs = DEFAULT_POLL_MS,
}: CrossAgentToastProps) {
  // On first mount we treat "now" as the horizon. Anything older is history
  // and must never surface as a toast.
  const sinceRef = useRef<string>(new Date().toISOString());
  // Dedup guard: an event is toasted exactly once per browser session.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const poll = async (): Promise<void> => {
      const events = await fetchEvents({
        since: sinceRef.current,
        forRole,
        limit: 5,
      });
      if (cancelledRef.current || events.length === 0) return;
      // Filter out debug/load-test noise and anything we already showed.
      const fresh = events.filter(
        (e) => !seenIdsRef.current.has(e.id) && !isDebugEvent(e)
      );
      // Always advance the cursor even if nothing passed the filter.
      const mostRecent = events.reduce(
        (acc, e) => (e.created_at > acc ? e.created_at : acc),
        sinceRef.current
      );
      sinceRef.current = mostRecent;
      if (fresh.length === 0) return;
      fresh.forEach((e) => {
        seenIdsRef.current.add(e.id);
        const described = describeEvent(e);
        const palette = agentPalette(e.agent_name);
        toast.custom(
          () => (
            <div
              className={`w-[340px] rounded-lg border ${palette.borderAccent} bg-white px-4 py-3 shadow-lg`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${palette.badgeBg} ${palette.badgeText}`}
                >
                  {palette.label}
                </span>
                <p className="text-xs font-semibold text-foreground">
                  {described.icon} {described.title}
                </p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {described.detail}
              </p>
            </div>
          ),
          { duration: TOAST_TTL_MS }
        );
      });
    };
    const id = setInterval(() => {
      void poll();
    }, pollIntervalMs);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
    };
  }, [forRole, pollIntervalMs]);

  // This component is purely a polling side-effect — no visual output.
  return null;
}
