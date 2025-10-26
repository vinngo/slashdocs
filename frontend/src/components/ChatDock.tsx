"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Pause } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStream } from "@/hooks/useChatStream";
import { ChatMessage } from "@/types/chat";

type ChatDockProps = {
  repoId?: string;
  filePaths?: string[];
  metadata?: Record<string, unknown>;
  title?: string;
};

export default function ChatDock({
  repoId,
  filePaths,
  metadata,
  title = "Chat",
}: ChatDockProps) {
  const {
    messages,
    status,
    error,
    isStreaming,
    sendMessage,
    stopStreaming,
    resetConversation,
  } = useChatStream({
    endpoint: "/api/repos/ask",
    repoId,
    filePaths,
    metadata,
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const latestAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant") return messages[i];
    }
    return null;
  }, [messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input, { repoId, filePaths, metadata });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">
            {status === "streaming"
              ? "Streaming response…"
              : status === "error"
                ? "Error"
                : status === "aborted"
                  ? "Stopped"
                  : "Idle"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={stopStreaming}
              className="flex items-center gap-1"
            >
              <Pause className="h-3 w-3" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={resetConversation}
              disabled={messages.length === 0}
            >
              Reset
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4 lg:flex-row">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
        <aside className="w-full shrink-0 border-t pt-3 text-xs lg:h-full lg:w-60 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">
          <h3 className="mb-2 font-semibold uppercase tracking-wide text-muted-foreground">
            Citations
          </h3>
          {latestAssistant?.citations?.length ? (
            <ul className="space-y-2">
              {latestAssistant.citations.map((citation, index) => (
                <li
                  key={`${citation.id}-${index}`}
                  className="rounded-md border bg-muted/40 px-2 py-2"
                >
                  <p className="font-medium text-foreground">
                    {citation.title ?? citation.file_path ?? citation.id}
                  </p>
                  {citation.snippet ? (
                    <p className="mt-1 text-muted-foreground">
                      {citation.snippet}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/80">
                    {citation.file_path}
                    {citation.start_line != null
                      ? ` · L${citation.start_line}${
                          citation.end_line ? `-${citation.end_line}` : ""
                        }`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              Citations will appear once the assistant references files.
            </p>
          )}
        </aside>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t px-4 py-3"
      >
        <Input
          value={input}
          placeholder="Ask about this repo…"
          onChange={(event) => setInput(event.target.value)}
          disabled={isStreaming}
        />
        <Button type="submit" disabled={isStreaming}>
          Send
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex w-full gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-xs rounded-lg px-3 py-2 text-sm sm:max-w-md ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <ReactMarkdown>{message.content || "…"}</ReactMarkdown>
      </div>
    </div>
  );
}
