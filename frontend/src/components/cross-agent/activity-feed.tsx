"use client";

import { useEffect, useRef, useState } from "react";
import { fetchEvents, type AgentEvent } from "@/lib/api-client";
import {
  agentPalette,
  describeEvent,
  isDebugEvent,
} from "./event-describer";

interface ActivityFeedProps {
  readonly forRole: "instructor" | "platform" | "all";
  readonly pollIntervalMs?: number;
  readonly maxItems?: number;
}

// Flow cards group handoffs between agents so the judge sees synergy, not a
// flat log. We walk the timeline oldest → newest and open a new flow every
// time a `learner_struggle` appears; downstream events that arrive within
// HANDOFF_WINDOW_MS of that anchor get attached to the same flow card.
interface FlowCard {
  readonly id: string;
  readonly events: ReadonlyArray<AgentEvent>;
  readonly anchorAt: string;
}

const HANDOFF_WINDOW_MS = 60_000;

function groupIntoFlows(
  events: ReadonlyArray<AgentEvent>
): ReadonlyArray<FlowCard> {
  if (events.length === 0) return [];
  // events arrive newest-first; walk oldest→newest so we can anchor flows.
  const chronological = [...events].sort((a, b) =>
    a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0
  );
  const flows: Array<{
    id: string;
    events: AgentEvent[];
    anchorAt: string;
    anchorMs: number;
  }> = [];
  let standalone: AgentEvent[] = [];
  for (const e of chronological) {
    const eMs = new Date(e.created_at).getTime();
    if (e.event_type === "learner_struggle") {
      flows.push({
        id: `flow-${e.id}`,
        events: [e],
        anchorAt: e.created_at,
        anchorMs: eMs,
      });
      continue;
    }
    // Try to attach downstream events (instructor/platform) to the most
    // recent open flow if they fall inside the handoff window.
    const candidate = flows[flows.length - 1];
    if (
      candidate &&
      eMs - candidate.anchorMs <= HANDOFF_WINDOW_MS &&
      (e.event_type === "instructor_struggle_analyzed" ||
        e.event_type === "promotion_suggested")
    ) {
      candidate.events.push(e);
      continue;
    }
    standalone.push(e);
  }
  // Standalone events become single-event cards.
  const standaloneFlows = standalone.map<FlowCard>((e) => ({
    id: `solo-${e.id}`,
    events: [e],
    anchorAt: e.created_at,
  }));
  const combined: FlowCard[] = [
    ...flows.map<FlowCard>((f) => ({
      id: f.id,
      events: f.events,
      anchorAt: f.anchorAt,
    })),
    ...standaloneFlows,
  ];
  // Newest flow first.
  combined.sort((a, b) =>
    a.anchorAt < b.anchorAt ? 1 : a.anchorAt > b.anchorAt ? -1 : 0
  );
  return combined;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "방금";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}초 전`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`;
  return `${Math.floor(diff / 3_600_000)}시간 전`;
}

export function ActivityFeed({
  forRole,
  pollIntervalMs = 8000,
  maxItems = 20,
}: ActivityFeedProps) {
  const [events, setEvents] = useState<ReadonlyArray<AgentEvent>>([]);
  // ActivityFeed is a timeline, so its first mount must include historical
  // events from the last 24 hours. This differs from Toast: Toast is a
  // popup surface where `since=now` is correct (no replaying old alerts),
  // but a timeline view has to show the user what recently happened the
  // moment they arrive on the page — otherwise the panel renders as empty
  // even when there are relevant cross-agent handoffs from the same session.
  // task-80-* debug events are already filtered downstream by isDebugEvent().
  const sinceRef = useRef<string>(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  );

  useEffect(() => {
    let cancelled = false;
    const poll = async (): Promise<void> => {
      const fresh = await fetchEvents({
        since: sinceRef.current,
        forRole,
        limit: maxItems,
      });
      if (cancelled || fresh.length === 0) return;
      const clean = fresh.filter((e) => !isDebugEvent(e));
      setEvents((prev) => {
        const merged = [...clean, ...prev];
        const seen = new Set<string>();
        const deduped: AgentEvent[] = [];
        for (const e of merged) {
          if (seen.has(e.id)) continue;
          seen.add(e.id);
          deduped.push(e);
        }
        // Sort by created_at desc so newest appears on top
        deduped.sort((a, b) =>
          a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0
        );
        return deduped.slice(0, maxItems);
      });
      const mostRecent = fresh.reduce(
        (acc, e) => (e.created_at > acc ? e.created_at : acc),
        sinceRef.current
      );
      sinceRef.current = mostRecent;
    };
    void poll();
    const id = setInterval(() => {
      void poll();
    }, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [forRole, pollIntervalMs, maxItems]);

  const flows = groupIntoFlows(events);

  return (
    <aside className="rounded-[10px] border border-[#ececec] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[#454950]">
          Cross-Agent Activity
        </h3>
        <span className="text-[10px] text-[#8a8d92]">live</span>
      </div>
      {flows.length === 0 ? (
        <p className="py-8 text-center text-[11px] text-[#8a8d92]">
          아직 에이전트 활동이 없습니다
        </p>
      ) : (
        <ul className="space-y-3">
          {flows.map((flow) => {
            const isHandoff = flow.events.length > 1;
            return (
              <li
                key={flow.id}
                className={`rounded-md border p-2 text-[11px] ${
                  isHandoff
                    ? "border-clover-200 bg-clover-50/40"
                    : "border-transparent bg-[#fafafa]"
                }`}
              >
                {isHandoff && (
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-clover-700">
                    <span>🔗</span>
                    <span>
                      Cross-Agent 협업 · {flow.events.length}단계 handoff
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  {flow.events.map((event, idx) => {
                    const described = describeEvent(event);
                    const palette = agentPalette(event.agent_name);
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-2"
                      >
                        {isHandoff && (
                          <div className="mt-1 flex flex-col items-center">
                            <span className="text-[10px]">
                              {idx === 0 ? "●" : "↓"}
                            </span>
                          </div>
                        )}
                        <span
                          className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${palette.badgeBg} ${palette.badgeText}`}
                        >
                          {palette.label}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-[#1f1f1f]">
                            {described.icon} {described.title}
                          </p>
                          <p className="mt-0.5 text-[10px] leading-snug text-gray-600">
                            {described.detail}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#8a8d92]">
                            {formatRelative(event.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
