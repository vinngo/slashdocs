"use client";

import { useEffect, useState } from "react";
import DocsViewer from "@/components/DocsViewer";
import { useParams, useSearchParams } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import { DocsData } from "@/lib/fake-data";

interface Status {
  status: "indexing" | "ready" | "error";
  progress: number;
  message: string;
}

export default function DocsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const repo_id = params.id;
  const [status, setStatus] = useState<Status>({
    status: (searchParams.get("status") as any) || "indexing",
    progress: 0,
    message: "Starting...",
  });

  const [docs, setDocs] = useState<DocsData | null>(null);
  const [error, setError] = useState("");

  if (true) {
    return <DocsViewer />;
  }

  return <LoadingScreen status={status} />;
}
