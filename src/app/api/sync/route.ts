import { auth } from "@/features/auth/auth";
import { syncProgress } from "@/features/sync/server";
import { parseSyncRequest } from "@/features/sync/validation";

/** Max request body; a full history of every chapter is about 60 KB. */
const MAX_BODY_BYTES = 256 * 1024;

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "forbidden" }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return Response.json({ error: "too_large" }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const changes = parseSyncRequest(body);
  if (!changes) return Response.json({ error: "invalid_request" }, { status: 400 });

  const state = await syncProgress(session.user.id, changes);
  return Response.json(state, { headers: { "Cache-Control": "no-store" } });
}
