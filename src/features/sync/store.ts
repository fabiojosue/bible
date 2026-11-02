"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

interface SyncState {
  /** Account the local progress was last synced with. */
  userId: string | null;
  /** Local changes up to this time are on the server. */
  pushedUpTo: number;
  status: SyncStatus;
  lastSyncedAt: number | null;
}

interface SyncActions {
  begin: (userId: string) => void;
  setStatus: (status: SyncStatus) => void;
  confirm: (pushedUpTo: number) => void;
  clear: () => void;
}

export const useSync = create<SyncState & SyncActions>()(
  persist(
    (set) => ({
      userId: null,
      pushedUpTo: 0,
      status: "idle",
      lastSyncedAt: null,
      // A different account (or the first sign-in) gets this device's whole history.
      begin: (userId) =>
        set((state) => (state.userId === userId ? state : { userId, pushedUpTo: 0 })),
      setStatus: (status) => set({ status }),
      confirm: (pushedUpTo) => set({ pushedUpTo, status: "synced", lastSyncedAt: Date.now() }),
      clear: () => set({ userId: null, pushedUpTo: 0, status: "idle", lastSyncedAt: null }),
    }),
    {
      name: "bible:sync",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ userId, pushedUpTo, lastSyncedAt }) => ({ userId, pushedUpTo, lastSyncedAt }),
    },
  ),
);
