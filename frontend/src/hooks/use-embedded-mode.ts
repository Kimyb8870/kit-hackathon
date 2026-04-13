"use client";

import { useEffect, useState } from "react";

/**
 * Context exposed by useEmbeddedMode.
 *
 * When the page is loaded with `?embedded=1`, the embedded flag is true and
 * the optional course coordinates may be populated either from the initial
 * query string or, after mount, from postMessage events dispatched by a host
 * frame (sample LMS).
 */
export interface EmbeddedContext {
  readonly embedded: boolean;
  readonly courseId: string | null;
  readonly chapterNo: number | null;
  readonly clipNo: number | null;
}

const EMPTY: EmbeddedContext = {
  embedded: false,
  courseId: null,
  chapterNo: null,
  clipNo: null,
};

function parseInteger(raw: string | null): number | null {
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function readContextFromLocation(): EmbeddedContext {
  if (typeof window === "undefined") return EMPTY;
  const params = new URLSearchParams(window.location.search);
  if (params.get("embedded") !== "1") return EMPTY;
  return {
    embedded: true,
    courseId: params.get("courseId"),
    chapterNo: parseInteger(params.get("chapterNo")),
    clipNo: parseInteger(params.get("clipNo")),
  };
}

/**
 * Reads embedded-mode flags from the current URL after mount.
 *
 * Server render and the very first client render return the empty context to
 * stay hydration-safe; the real value is filled in inside `useEffect`. This
 * means the host page may flash its standalone chrome for a single frame on a
 * hard navigation, which is acceptable for the iframe-only use case.
 */
export function useEmbeddedMode(): EmbeddedContext {
  const [ctx, setCtx] = useState<EmbeddedContext>(EMPTY);

  useEffect(() => {
    setCtx(readContextFromLocation());
  }, []);

  return ctx;
}
