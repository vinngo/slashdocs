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
  const collection_name = params.id as string;

  // Extract repo name from collection name (format: repo_{repo_name})
  const repo_name = collection_name.startsWith("repo_")
    ? collection_name.slice(5)
    : collection_name;

  const [status, setStatus] = useState<Status>({
    status: (searchParams.get("status") as any) || "indexing",
    progress: 0,
    message: "Starting...",
  });
  const [docs, setDocs] = useState<DocsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDocs(repo_name);
  }, [repo_name]);

  const fetchDocs = async (repo_name: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/repos/docs?repo_name=${encodeURIComponent(repo_name)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response_data = await response.json();

      if (!response.ok || !response_data.success) {
        setError(response_data.error || "Failed to fetch docs");
        setLoading(false);
        return;
      }

      setDocs(response_data.docs);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch docs");
    } finally {
      setLoading(false);
    }
  };

  if (!loading && docs) {
    return <DocsViewer docs={docs} />;
  }

  return <LoadingScreen status={status} />;
}
