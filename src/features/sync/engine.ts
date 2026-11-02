"use client";

import { positionRecordOf, useProgress } from "@/features/progress/store";
import { marksChangedSince, type SyncRequest, type SyncResponse } from "./protocol";
import { useSync } from "./store";

/** Waits for a burst of changes (e.g. scrolling) to settle before syncing. */
const DEBOUNCE = 2000;
/** Browsers cap `keepalive` request bodies at 64 KB. */
const KEEPALIVE_LIMIT = 60_000;
const RETRY = 30_000;

let inFlight: Promise<void> | null = null;
let queued = false;
let applyingRemote = false;

function pendingChanges(): SyncRequest {
  const progress = useProgress.getState();
  const { pushedUpTo } = useSync.getState();
  const position = positionRecordOf(progress);
  return {
    marks: marksChangedSince(progress.marks, pushedUpTo),
    ...(position && position.at > pushedUpTo ? { position } : {}),
  };
}

function hasChanges(request: SyncRequest): boolean {
  return request.position !== undefined || Object.keys(request.marks).length > 0;
}

async function run(keepalive: boolean): Promise<void> {
  const startedAt = Date.now();
  const body = JSON.stringify(pendingChanges());
  const sync = useSync.getState();
  sync.setStatus("syncing");
  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "same-origin",
      keepalive: keepalive && body.length < KEEPALIVE_LIMIT,
    });
    if (response.status === 401) {
      sync.setStatus("idle");
      return;
    }
    if (!response.ok) throw new Error(`Sync failed with ${response.status}`);
    const remote = (await response.json()) as SyncResponse;
    applyingRemote = true;
    try {
      useProgress.getState().applyRemote(remote);
    } finally {
      applyingRemote = false;
    }
    sync.confirm(startedAt);
  } catch {
    sync.setStatus(navigator.onLine ? "error" : "offline");
  }
}

/** Pushes local changes and pulls the account's state. Concurrent calls coalesce. */
export function syncNow({ keepalive = false } = {}): Promise<void> {
  if (inFlight) {
    queued = true;
    return inFlight;
  }
  inFlight = run(keepalive).finally(() => {
    inFlight = null;
    if (queued) {
      queued = false;
      void syncNow();
    }
  });
  return inFlight;
}

/** Keeps the signed-in account in sync with this device until the returned stop is called. */
export function startSync(userId: string): () => void {
  useSync.getState().begin(userId);
  let timer: number | undefined;

  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void syncNow(), DEBOUNCE);
  };
  const unsubscribe = useProgress.subscribe((state, previous) => {
    if (applyingRemote) return;
    if (state.marks !== previous.marks || state.positionAt !== previous.positionAt) schedule();
  });
  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      void syncNow();
    } else if (hasChanges(pendingChanges())) {
      window.clearTimeout(timer);
      void syncNow({ keepalive: true });
    }
  };
  const onOnline = () => void syncNow();
  let retryTimer: number | undefined;
  const unsubscribeStatus = useSync.subscribe((state, previous) => {
    if (state.status !== "error" || previous.status === "error") return;
    window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(() => {
      if (document.visibilityState === "visible") void syncNow();
    }, RETRY);
  });

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("online", onOnline);
  void syncNow();

  return () => {
    window.clearTimeout(timer);
    window.clearTimeout(retryTimer);
    unsubscribe();
    unsubscribeStatus();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("online", onOnline);
  };
}
