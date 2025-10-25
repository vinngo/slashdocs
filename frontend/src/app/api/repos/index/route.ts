import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url: github_url } = body;

    if (!github_url || !github_url.includes("github.com")) {
      return NextResponse.json(
        { error: "Invalid GitHub URL" },
        { status: 400 },
      );
    }

    // Call FastAPI backend with repo_url as query parameter
    const backendUrl = `http://127.0.0.1:8000/api/ingest?repo_url=${encodeURIComponent(github_url)}`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to index repository" },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      indexed: data.indexed,
    });
  } catch (err) {
    console.error("Error indexing repository:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to index repository",
      },
      { status: 500 },
    );
  }
}
