import { create } from "zustand";
import type { Message, ToolLog } from "@/types/chat";

// Instructor-side chat state. Mirrors the shape of chat-store but without
// learner-specific fields (courseContext, pendingAutoMessage) so the
// instructor chat surface can't accidentally read learner session state.
interface InstructorChatState {
  readonly messages: ReadonlyArray<Message>;
  readonly isStreaming: boolean;
  readonly toolLogs: ReadonlyArray<ToolLog>;
  readonly showToolLog: boolean;
  readonly addMessage: (message: Message) => void;
  readonly updateLastMessage: (content: string) => void;
  readonly addToolLog: (log: ToolLog) => void;
  readonly updateToolLog: (
    toolName: string,
    update: Partial<Pick<ToolLog, "output" | "status" | "duration">>
  ) => void;
  readonly setShowToolLog: (show: boolean) => void;
  readonly toggleToolLog: () => void;
  readonly clearChat: () => void;
  readonly setIsStreaming: (streaming: boolean) => void;
}

export const useInstructorStore = create<InstructorChatState>((set) => ({
  messages: [],
  isStreaming: false,
  toolLogs: [],
  showToolLog: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateLastMessage: (content) =>
    set((state) => {
      const messages = state.messages;
      if (messages.length === 0) return state;
      const last = messages[messages.length - 1];
      return {
        messages: [
          ...messages.slice(0, -1),
          { ...last, content: last.content + content },
        ],
      };
    }),

  addToolLog: (log) =>
    set((state) => ({
      toolLogs: [...state.toolLogs, log],
    })),

  updateToolLog: (toolName, update) =>
    set((state) => {
      const reversedIdx = [...state.toolLogs]
        .reverse()
        .findIndex((l) => l.tool === toolName && l.status === "running");
      if (reversedIdx === -1) return state;
      const idx = state.toolLogs.length - 1 - reversedIdx;
      return {
        toolLogs: state.toolLogs.map((l, i) =>
          i === idx ? { ...l, ...update } : l
        ),
      };
    }),

  setShowToolLog: (show) => set({ showToolLog: show }),

  toggleToolLog: () =>
    set((state) => ({
      showToolLog: !state.showToolLog,
    })),

  clearChat: () =>
    set({
      messages: [],
      toolLogs: [],
      isStreaming: false,
    }),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
}));

// Cross-frame toolLogs sync. The LMS instructor-center page hosts the chat
// in an iframe (/instructor?embedded=1) and also renders ToolCallSideCard
// in its own document. Each frame has a separate zustand instance, so
// without a bridge the side card would stay empty forever. We use
// BroadcastChannel to mirror toolLogs between same-origin frames: whenever
// the embedded chat updates its toolLogs, the outer document receives the
// same array and re-renders the side card.
if (typeof window !== "undefined") {
  try {
    const channel = new BroadcastChannel("clover-instructor-tool-logs");
    let applyingRemote = false;
    useInstructorStore.subscribe((state, prevState) => {
      if (applyingRemote) return;
      if (state.toolLogs === prevState.toolLogs) return;
      channel.postMessage({ toolLogs: state.toolLogs });
    });
    channel.onmessage = (event: MessageEvent) => {
      const data = event.data as { toolLogs?: unknown } | null;
      if (!data || !Array.isArray(data.toolLogs)) return;
      applyingRemote = true;
      try {
        useInstructorStore.setState({
          toolLogs: data.toolLogs as ReadonlyArray<ToolLog>,
        });
      } finally {
        applyingRemote = false;
      }
    };
  } catch {
    // BroadcastChannel unavailable (old browser or disabled) — the side
    // card will still work inside the same frame.
  }
}
