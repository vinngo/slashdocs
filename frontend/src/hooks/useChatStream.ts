"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ChatCitation,
  ChatCompletionRequest,
  ChatCompletionRequestMessage,
  ChatMessage,
  ChatStreamChunk,
  ChatStreamError,
  ChatStreamProtocol,
  ChatStreamStatus,
} from "@/types/chat";

type SendMessageOptions = {
  protocol?: ChatStreamProtocol;
  repoId?: string;
  filePaths?: string[];
  metadata?: Record<string, unknown>;
  extraPayload?: Record<string, unknown>;
};

type UseChatStreamOptions = {
  endpoint?: string;
  protocol?: ChatStreamProtocol;
  repoId?: string;
  filePaths?: string[];
  metadata?: Record<string, unknown>;
  initialMessages?: ChatMessage[];
};

type ProcessChunkFn = (chunk: ChatStreamChunk) => void;

const textDecoder = new TextDecoder();

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `tmp-${Math.random().toString(36).slice(2, 9)}`;

function parseSSE(buffer: string) {
  const frames = buffer.split("\n\n");
  const complete = frames.slice(0, -1);
  const remaining = frames.at(-1) ?? "";
  const payloads: string[] = [];

  for (const frame of complete) {
    const trimmed = frame.trim();
    if (!trimmed) continue;

    const dataLines = trimmed
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("");

    if (dataLines) {
      payloads.push(dataLines);
    }
  }

  return { payloads, remaining };
}

function parseNDJSON(buffer: string) {
  const lines = buffer.split("\n");
  const complete = lines.slice(0, -1);
  const remaining = lines.at(-1) ?? "";
  const payloads = complete.map((line) => line.trim()).filter(Boolean);
  return { payloads, remaining };
}

function mergeCitations(
  existing: ChatCitation[] | undefined,
  next: ChatCitation | ChatCitation[] | undefined,
) {
  if (!next) return existing ?? [];
  const incoming = Array.isArray(next) ? next : [next];
  return [...(existing ?? []), ...incoming];
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const {
    endpoint: endpointOverride,
    protocol: defaultProtocol = "auto",
    repoId: defaultRepoId,
    filePaths: defaultFilePaths,
    metadata: defaultMetadata,
    initialMessages = [],
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const pendingAssistantIdRef = useRef<string | null>(null);
  const defaultsRef = useRef({
    repoId: defaultRepoId,
    filePaths: defaultFilePaths,
    metadata: defaultMetadata,
  });

  const endpoint = useMemo(
    () => endpointOverride ?? process.env.NEXT_PUBLIC_CHAT_ENDPOINT ?? "",
    [endpointOverride],
  );

  const stopStreaming = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("aborted");
  }, []);

  const resetConversation = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    pendingAssistantIdRef.current = null;
    setMessages(initialMessages);
    setStatus("idle");
    setError(null);
  }, [initialMessages]);

  const updateAssistant = useCallback(
    (id: string, updater: (message: ChatMessage) => ChatMessage) => {
      setMessages((prev) =>
        prev.map((message) => (message.id === id ? updater(message) : message)),
      );
    },
    [],
  );

  const processChunk: ProcessChunkFn = useCallback(
    (chunk) => {
      const assistantId = pendingAssistantIdRef.current;
      if (!assistantId) return;

      if (chunk.type === "token" && chunk.delta) {
        updateAssistant(assistantId, (message) => ({
          ...message,
          content: `${message.content}${chunk.delta}`,
        }));
        return;
      }

      if (chunk.type === "citation") {
        const merged = mergeCitations(
          undefined,
          chunk.citation ?? chunk.citations,
        );
        if (!merged.length) return;
        updateAssistant(assistantId, (message) => ({
          ...message,
          citations: mergeCitations(message.citations, merged),
        }));
        return;
      }

      if (chunk.type === "error" && chunk.error) {
        setStatus("error");
        setError(chunk.error.message);
        updateAssistant(assistantId, (message) => ({
          ...message,
          content: message.content || "[stream aborted]",
        }));
        return;
      }

      if (chunk.type === "control") {
        if (chunk.status === "aborted") {
          setStatus("aborted");
        } else if (chunk.status === "completed") {
          setStatus("idle");
        }
        pendingAssistantIdRef.current = null;
      }
    },
    [setError, updateAssistant],
  );

  const sendMessage = useCallback(
    async (input: string, sendOptions: SendMessageOptions = {}) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      if (!endpoint) {
        setStatus("error");
        setError(
          "Chat endpoint is not configured (NEXT_PUBLIC_CHAT_ENDPOINT missing).",
        );
        return;
      }

      controllerRef.current?.abort();
      setError(null);

      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus("streaming");

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      const assistantId = createId();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        citations: [],
        createdAt: new Date().toISOString(),
      };

      pendingAssistantIdRef.current = assistantId;

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      const history: ChatCompletionRequestMessage[] = [
        ...messages
          .filter(
            (message) =>
              message.role !== "assistant" ||
              message.content.trim().length > 0,
          )
          .map<ChatCompletionRequestMessage>((message) => ({
            role: message.role,
            content: message.content,
          })),
        { role: "user", content: trimmed },
      ];

      const payload: ChatCompletionRequest = {
        messages: history,
        repo_id: sendOptions.repoId ?? defaultsRef.current.repoId,
        file_paths: sendOptions.filePaths ?? defaultsRef.current.filePaths,
        metadata: {
          ...defaultsRef.current.metadata,
          ...sendOptions.metadata,
        },
        stream: true,
        ...sendOptions.extraPayload,
      };

      const negotiatedProtocol =
        sendOptions.protocol ?? defaultProtocol ?? "auto";
      const preferredProtocol =
        negotiatedProtocol === "auto" ? "sse" : negotiatedProtocol;
      const acceptHeader =
        preferredProtocol === "ndjson"
          ? "application/x-ndjson"
          : "text/event-stream";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: acceptHeader,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as {
            error?: ChatStreamError;
          } | null;

          const message =
            errorBody?.error?.message ??
            `Chat request failed (${response.status})`;
          setStatus("error");
          setError(message);
          pendingAssistantIdRef.current = null;
          return;
        }

        const actualProtocol =
          negotiatedProtocol === "auto"
            ? response.headers
                .get("content-type")
                ?.includes("application/x-ndjson")
              ? "ndjson"
              : "sse"
            : preferredProtocol;

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Streaming reader not available.");
        }

        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += textDecoder.decode(value, { stream: true });

          if (actualProtocol === "ndjson") {
            const { payloads, remaining } = parseNDJSON(buffer);
            buffer = remaining;
            for (const payload of payloads) {
              try {
                const chunk = JSON.parse(payload) as ChatStreamChunk;
                processChunk(chunk);
              } catch (err) {
                console.warn("Failed to parse NDJSON chunk", err);
              }
            }
          } else {
            const { payloads, remaining } = parseSSE(buffer);
            buffer = remaining;
            for (const payload of payloads) {
              try {
                const chunk = JSON.parse(payload) as ChatStreamChunk;
                processChunk(chunk);
              } catch (err) {
                console.warn("Failed to parse SSE chunk", err);
              }
            }
          }
        }

        if (buffer.trim().length) {
          try {
            const chunk = JSON.parse(buffer.trim()) as ChatStreamChunk;
            processChunk(chunk);
          } catch {
            // ignore trailing partial JSON
          }
        }

        if (status !== "error" && status !== "aborted") {
          setStatus("idle");
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setStatus("aborted");
        } else {
          console.error(err);
          setStatus("error");
          setError((err as Error).message);
        }
      } finally {
        controllerRef.current = null;
      }
    },
    [defaultProtocol, endpoint, messages, processChunk, setError, status],
  );

  return {
    messages,
    status,
    error,
    isStreaming: status === "streaming",
    sendMessage,
    stopStreaming,
    resetConversation,
  };
}
