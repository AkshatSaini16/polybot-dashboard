import { NextRequest, NextResponse } from "next/server";

// GitHub repo details — used to commit proposal decisions back to the repo
const GITHUB_OWNER = "AkshatSaini16";
const GITHUB_REPO = "polybot-dashboard";
const META_PATH = "public/data/meta.json";

async function githubApi(
  endpoint: string,
  method: string = "GET",
  body?: object,
): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  return fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function getMetaFromGitHub(): Promise<{ content: Record<string, unknown>; sha: string }> {
  const resp = await githubApi(`/contents/${META_PATH}`);
  if (!resp.ok) throw new Error(`Failed to fetch meta.json: ${resp.status}`);
  const data = await resp.json();
  const content = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
  return { content, sha: data.sha };
}

async function commitMetaToGitHub(
  content: Record<string, unknown>,
  sha: string,
  message: string,
): Promise<void> {
  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString("base64");
  const resp = await githubApi(`/contents/${META_PATH}`, "PUT", {
    message: `${message}\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`,
    content: encoded,
    sha,
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`GitHub commit failed: ${resp.status} ${err}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (typeof id !== "number" || id < 0) {
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });
    }

    // Read current meta.json from GitHub
    const { content: meta, sha } = await getMetaFromGitHub();
    const proposals = (meta.pending_proposals as Record<string, unknown>[]) || [];

    if (id >= proposals.length) {
      return NextResponse.json({ error: `Proposal #${id} not found` }, { status: 404 });
    }

    // Remove the proposal from pending
    const proposal = proposals.splice(id, 1)[0];
    meta.pending_proposals = proposals;

    // Add to action history
    const history = (meta.action_history as Record<string, unknown>[]) || [];
    history.push({
      ...proposal,
      decision: action === "approve" ? "approved" : "rejected",
      decided_at: new Date().toISOString(),
    });
    meta.action_history = history.slice(-20);

    // If approved, mark it for the hourly deploy to execute against the DB
    if (action === "approve") {
      const queue = (meta.approved_queue as Record<string, unknown>[]) || [];
      queue.push(proposal);
      meta.approved_queue = queue;
    }

    // Commit back to GitHub
    const label = (proposal as Record<string, unknown>).label ||
                  (proposal as Record<string, unknown>).wallet ||
                  (proposal as Record<string, unknown>).param || "";
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    await commitMetaToGitHub(
      meta,
      sha,
      `${action === "approve" ? "Approve" : "Reject"} proposal #${id}: ${label} (${timestamp})`,
    );

    return NextResponse.json({
      success: true,
      action,
      id,
      message: `${action === "approve" ? "Approved" : "Rejected"} — ${label}. ${action === "approve" ? "Will be applied on next hourly cycle." : ""}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Proposal action failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { content: meta } = await getMetaFromGitHub();
    return NextResponse.json({
      proposals: meta.pending_proposals || [],
      action_history: meta.action_history || [],
    });
  } catch {
    return NextResponse.json({ proposals: [], action_history: [] });
  }
}
