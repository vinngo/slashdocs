"use client";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useState } from "react";

export default function Hero() {
  const router = useRouter();
  const [error, setError] = useState("");

  const validateGithubUrl = (url: string): boolean => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(url.trim());
  };

  const handleSubmit = async (formData: FormData) => {
    setError("");

    const data = { url: formData.get("url") as string };

    if (!data.url.trim()) {
      setError("Please enter a Github URL");
      return;
    }

    if (!validateGithubUrl(data.url)) {
      setError(
        "Please enter a valid Github repository URL (e.g., https://github.com/user/repo)",
      );
      return;
    }

    try {
      /*

         call FastAPI to request indexing

      */
      router.push("/docs/1");
    } catch (e) {
      setError("Failed to index repository. Please try again. ");
      return;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
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
        className="py-20 flex flex-col gap-3 items-center"
        action={handleSubmit}
      >
        <Input
          name="url"
          className="h-10 w-full"
          placeholder="https://github.com/user/repo"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button>Start Indexing</Button>
      </form>
    </div>
  );
}
