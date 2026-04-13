import { create } from "zustand";

export interface LmsInstructorContext {
  readonly instructor_id: string;
  readonly course_ids: ReadonlyArray<string>;
  readonly time_window_days: number;
}

export interface LmsPlatformContext {
  readonly operator_role: string;
  readonly focus_categories: ReadonlyArray<string>;
  readonly time_window_days: number;
}

interface LmsContextState {
  readonly instructor: LmsInstructorContext | null;
  readonly platform: LmsPlatformContext | null;
  readonly setInstructor: (ctx: LmsInstructorContext | null) => void;
  readonly setPlatform: (ctx: LmsPlatformContext | null) => void;
}

// Holds the LMS-provided context that an instructor or operator page has
// received via postMessage. The chat hooks read this synchronously at
// sendMessage time so the backend can pre-fill tool arguments based on the
// viewer's instructor_id / course list / focus categories.
export const useLmsContextStore = create<LmsContextState>((set) => ({
  instructor: null,
  platform: null,
  setInstructor: (ctx) => set({ instructor: ctx }),
  setPlatform: (ctx) => set({ platform: ctx }),
}));
