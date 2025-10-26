import ChatDock from "@/components/ChatDock";

interface ChatContentProps {
  repoId: string;
}

export default function ChatContent({ repoId }: ChatContentProps) {
  return (
    <div className="h-full p-8">
      <ChatDock
        repoId={repoId}
        title={`Chat with ${repoId}`}
        metadata={{ source: "docs-viewer" }}
      />
    </div>
  );
}
