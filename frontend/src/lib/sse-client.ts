export type SSEEventType =
  | "token"
  | "tool_call"
  | "tool_result"
  | "message_part"
  | "done";

export interface SSECallbacks {
  readonly onToken?: (token: string) => void;
  readonly onToolCall?: (data: {
    tool: string;
    input: Record<string, unknown>;
  }) => void;
  readonly onToolResult?: (data: {
    tool: string;
    output: string;
    status: string;
    duration: number;
  }) => void;
  readonly onMessagePart?: (data: { content: string }) => void;
  readonly onDone?: () => void;
  readonly onError?: (error: Error) => void;
}

export async function connectSSE(
  url: string,
  body: Record<string, unknown>,
  callbacks: SSECallbacks
): Promise<AbortController> {
  const controller = new AbortController();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`SSE connection failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No readable stream available");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    // SSE event accumulator state — persists across chunk boundaries.
    // The previous implementation reset `currentEvent` on every chunk,
    // which caused events whose `event:` and `data:` lines straddled
    // a network read boundary to be silently dropped (see bug report:
    // mid-sentence truncation in 2/3 of responses).
    let pendingEvent: SSEEventType | null = null;
    let pendingData: string | null = null;
    // Guard against onDone firing twice (once from the explicit `done`
    // event and again on stream EOF).
    let doneFired = false;

    const wrappedCallbacks: SSECallbacks = {
      ...callbacks,
      onDone: () => {
        if (doneFired) return;
        doneFired = true;
        callbacks.onDone?.();
      },
    };

    const dispatchPending = (): void => {
      if (pendingEvent && pendingData !== null) {
        handleEvent(pendingEvent, pendingData, wrappedCallbacks);
      }
      pendingEvent = null;
      pendingData = null;
    };

    const processLine = (rawLine: string): void => {
      // Strip optional trailing CR so both \r\n and \n line endings work.
      const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;

      if (line.length === 0) {
        // Blank line is the SSE event terminator — flush whatever we have.
        dispatchPending();
        return;
      }

      if (line.startsWith("event:")) {
        // Per SSE spec the field value starts after the colon and an
        // optional single space.
        const value = line.slice(6).replace(/^ /, "");
        pendingEvent = value as SSEEventType;
        return;
      }

      if (line.startsWith("data:")) {
        const value = line.slice(5).replace(/^ /, "");
        // Multiple data: lines are concatenated with \n per the SSE spec.
        pendingData = pendingData === null ? value : `${pendingData}\n${value}`;
        return;
      }

      // Ignore comments (lines starting with ":") and unknown fields.
    };

    const processStream = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Flush any decoder state and any final un-terminated event.
          buffer += decoder.decode();
          if (buffer.length > 0) {
            const tailLines = buffer.split("\n");
            for (const line of tailLines) {
              processLine(line);
            }
            buffer = "";
          }
          dispatchPending();
          wrappedCallbacks.onDone?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the trailing fragment (possibly an incomplete line) in
        // the buffer for the next read.
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          processLine(line);
        }
      }
    };

    processStream().catch((err) => {
      if (err instanceof Error && err.name !== "AbortError") {
        callbacks.onError?.(err);
      }
    });
  } catch (err) {
    if (err instanceof Error && err.name !== "AbortError") {
      callbacks.onError?.(err);
    }
  }

  return controller;
}

function handleEvent(
  event: SSEEventType,
  rawData: string,
  callbacks: SSECallbacks
): void {
  try {
    switch (event) {
      case "token": {
        const tokenData = JSON.parse(rawData);
        callbacks.onToken?.(tokenData.content ?? "");
        break;
      }
      case "tool_call": {
        const tcData = JSON.parse(rawData);
        callbacks.onToolCall?.({
          tool: tcData.name ?? "",
          input: typeof tcData.args === "string"
            ? (() => { try { return JSON.parse(tcData.args); } catch { return { raw: tcData.args }; } })()
            : tcData.args ?? {},
        });
        break;
      }
      case "tool_result": {
        const trData = JSON.parse(rawData);
        callbacks.onToolResult?.({
          tool: trData.name ?? "",
          output: typeof trData.content === "string" ? trData.content : JSON.stringify(trData.content),
          status: "success",
          duration: 0,
        });
        break;
      }
      case "message_part":
        callbacks.onMessagePart?.(JSON.parse(rawData));
        break;
      case "done":
        callbacks.onDone?.();
        break;
    }
  } catch {
    callbacks.onError?.(new Error(`Failed to parse SSE event: ${event}`));
  }
}
