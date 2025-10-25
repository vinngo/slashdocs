export type ChatMessageRole = "system" | "user" | "assistant";

export interface ChatCitation {
  id: string;
  file_path?: string;
  repo_id?: string;
  url?: string;
  title?: string;
  snippet?: string;
  start_line?: number;
  end_line?: number;
  score?: number;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt?: string;
  citations?: ChatCitation[];
}

export interface ChatCompletionRequestMessage {
  role: ChatMessageRole;
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatCompletionRequestMessage[];
  repo_id?: string;
  file_paths?: string[];
  metadata?: Record<string, unknown>;
  stream?: boolean;
  [key: string]: unknown;
}

export type ChatStreamProtocol = "sse" | "ndjson" | "auto";

export type ChatStreamChunkType = "token" | "citation" | "control" | "error";

export interface ChatStreamChunk {
  type: ChatStreamChunkType;
  message_id: string;
  delta?: string;
  citations?: ChatCitation[];
  citation?: ChatCitation;
  status?: "in_progress" | "completed" | "aborted";
  error?: ChatStreamError;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  [key: string]: unknown;
}

export interface ChatStreamError {
  code: string;
  message: string;
  retryable?: boolean;
}

export type ChatStreamStatus = "idle" | "streaming" | "error" | "aborted";
