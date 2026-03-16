import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// Project root is two levels up from dashboard/
const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const PYTHON = "/opt/homebrew/bin/python3.11";
const DB_PATH = path.join(PROJECT_ROOT, "data/polybot.db");

async function runCommand(cmd: string): Promise<{ stdout: string; stderr: string }> {
  return execAsync(cmd, {
    cwd: PROJECT_ROOT,
    env: { ...process.env, PATH: `/opt/homebrew/bin:${process.env.PATH}` },
    timeout: 30000,
  });
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

    // Run the approve/reject script
    const flag = action === "approve" ? "--approve" : "--reject";
    const { stdout: scriptOut } = await runCommand(
      `${PYTHON} scripts/approve_proposal.py ${flag} ${id} --db ${DB_PATH}`
    );

    // Re-export dashboard data
    const { stdout: exportOut } = await runCommand(
      `${PYTHON} scripts/export_dashboard_data.py --db ${DB_PATH} --capital 59.88`
    );

    // Git commit and push
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    const commitMsg = `${action === "approve" ? "Approve" : "Reject"} AI proposal #${id} (${timestamp})`;

    await runCommand(
      `cd dashboard && git add public/data/ && git commit -m "${commitMsg}\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>" && git push`
    );

    return NextResponse.json({
      success: true,
      action,
      id,
      message: scriptOut.trim(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Proposal action failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  // Return current proposals
  try {
    const fs = await import("fs/promises");
    const metaPath = path.join(process.cwd(), "public/data/meta.json");
    const data = JSON.parse(await fs.readFile(metaPath, "utf-8"));
    return NextResponse.json({
      proposals: data.pending_proposals || [],
      action_history: data.action_history || [],
    });
  } catch {
    return NextResponse.json({ proposals: [], action_history: [] });
  }
}
