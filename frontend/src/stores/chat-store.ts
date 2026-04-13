import { create } from "zustand";
import type { Message, ToolLog } from "@/types/chat";

export interface CourseContext {
  readonly courseId: string;
  readonly chapterNo: number | null;
  readonly clipNo: number | null;
}

// A message queued by another part of the app (e.g. the study-schedule
// "학습하기" button) that should be auto-sent into the learner chat as soon
// as the chat surface mounts. The chat-container clears it after sending.
// Each click constructs a fresh object so identity-based de-dupe still
// admits a second click on the same item.
export interface PendingAutoMessage {
  readonly text: string;
  readonly source: "study-schedule" | "other";
  readonly context?: {
    readonly courseTitle?: string;
    readonly chapter?: string;
    readonly clip?: string;
    readonly type?: string;
  };
  // Structured course pointer the backend can pass directly into
  // `course_context`. Without this, the agent has to parse the natural
  // language `text` to figure out which course/clip the learner means —
  // which is what caused the InvalidTextRepresentation 503 (the LLM was
  // calling get_current_clip with the human course title).
  readonly courseContext?: {
    readonly course_id: string;
    readonly chapter_no?: number;
    readonly clip_no?: number;
  };
}

interface ChatState {
  readonly messages: ReadonlyArray<Message>;
  readonly isStreaming: boolean;
  readonly toolLogs: ReadonlyArray<ToolLog>;
  readonly showToolLog: boolean;
  readonly courseContext: CourseContext | null;
  readonly pendingAutoMessage: PendingAutoMessage | null;
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
  readonly setCourseContext: (context: CourseContext | null) => void;
  readonly setPendingAutoMessage: (msg: PendingAutoMessage) => void;
  readonly clearPendingAutoMessage: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  toolLogs: [],
  showToolLog: false,
  courseContext: null,
  pendingAutoMessage: null,

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

  setShowToolLog: (show) =>
    set({ showToolLog: show }),

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

  setIsStreaming: (streaming) =>
    set({ isStreaming: streaming }),

  setCourseContext: (context) =>
    set({ courseContext: context }),

  setPendingAutoMessage: (msg) =>
    set({ pendingAutoMessage: msg }),

  clearPendingAutoMessage: () =>
    set({ pendingAutoMessage: null }),
}));
