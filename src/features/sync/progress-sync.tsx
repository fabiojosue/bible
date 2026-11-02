"use client";

import { useEffect } from "react";
import { useSession } from "@/features/auth/auth-client";
import { useProgress } from "@/features/progress/store";
import { startSync } from "./engine";

/** Syncs reading progress with the account while someone is signed in. */
export function ProgressSync() {
  const userId = useSession().data?.user.id;

  useEffect(() => {
    if (!userId) return;
    // Merge only after this device's saved progress has loaded.
    if (useProgress.persist.hasHydrated()) return startSync(userId);
    let stop: (() => void) | undefined;
    const unsubscribe = useProgress.persist.onFinishHydration(() => {
      stop = startSync(userId);
    });
    return () => {
      unsubscribe();
      stop?.();
    };
  }, [userId]);

  return null;
}
