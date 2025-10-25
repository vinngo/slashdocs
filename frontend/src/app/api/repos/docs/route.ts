import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get repo_name from query parameters
    const { searchParams } = new URL(request.url);
    const repo_name = searchParams.get("repo_name");

    if (!repo_name) {
      return NextResponse.json(
        { error: "repo_name query parameter is required" },
        { status: 400 },
      );
    }

    const backendUrl = `http://127.0.0.1:8000/api/repos/${repo_name}/docs`;

    console.log("Fetching docs from:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch docs" },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      docs: data,
    });
  } catch (err) {
    console.error("Error fetching docs:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to fetch docs",
      },
      { status: 500 },
    );
  }
}
