"use client";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useState } from "react";

export default function Hero() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateGithubUrl = (url: string): boolean => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(url.trim());
  };

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setLoading(true);

    const url = formData.get("url") as string;

    if (!url.trim()) {
      setError("Please enter a Github URL");
      setLoading(false);
      return;
    }

    if (!validateGithubUrl(url)) {
      setError(
        "Please enter a valid Github repository URL (e.g., https://github.com/user/repo)",
      );
      setLoading(false);
      return;
    }

    try {
      const result = await fetch("/api/repos/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const response_data = await result.json();

      if (!result.ok || !response_data.success) {
        setError(
          response_data.error ||
            "Failed to index repository. Please try again.",
        );
        setLoading(false);
        return;
      }

      // Redirect to docs page using collection_name
      if (response_data.indexed?.collection_name) {
        router.push(`/docs/${response_data.indexed.collection_name}`);
      } else {
        setError("Repository indexed but no collection ID returned");
        setLoading(false);
      }
    } catch (e) {
      console.error("Error during indexing:", e);
      setError("Failed to index repository. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen overflow-hidden">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-center">
          Index any Github repo
          <br />
          Get beautiful documentation
          <br />
          +
          <br />
          RAG-informed chat
        </h1>
        <form
          className="py-15 flex flex-col gap-3 items-center w-full"
          action={handleSubmit}
        >
          <Input
            name="url"
            className="h-10 w-max"
            placeholder="https://github.com/user/repo"
            required
            disabled={loading}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button disabled={loading}>
            {loading ? "Indexing..." : "Start Indexing"}
          </Button>
        </form>
      </div>
    </div>
  );
}
