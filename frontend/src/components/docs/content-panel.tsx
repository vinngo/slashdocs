import ReactMarkdown from "react-markdown";

interface ContentPanelProps {
  title: string;
  content: string;
  viewMode: "docs" | "code";
}

export default function ContentPanel({
  title,
  content,
  viewMode,
}: ContentPanelProps) {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 border-b flex items-center justify-between px-6">
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </main>
  );
}
