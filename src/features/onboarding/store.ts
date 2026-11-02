"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface OnboardingState {
  completedAt: number | null;
  /** Not persisted: whether the tour is currently showing. */
  open: boolean;
  start: () => void;
  finish: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      completedAt: null,
      open: false,
      start: () => set({ open: true }),
      finish: () => set({ open: false, completedAt: Date.now() }),
    }),
    {
      name: "bible:onboarding",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ completedAt }) => ({ completedAt }),
    },
  ),
);
