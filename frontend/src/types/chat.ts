export interface Message {
  readonly id: string;
  readonly role: "user" | "assistant" | "system";
  readonly content: string;
  readonly type?: "text" | "tool_call" | "tool_result";
  readonly toolCalls?: ReadonlyArray<ToolLog>;
}

export interface ToolLog {
  readonly id: string;
  readonly tool: string;
  readonly input: Record<string, unknown>;
  readonly output: string;
  readonly status: "pending" | "running" | "success" | "error";
  readonly duration?: number;
  readonly timestamp: number;
}

export interface ChatResponse {
  readonly messageId: string;
  readonly content: string;
  readonly toolCalls?: ReadonlyArray<ToolLog>;
}
