"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface OnboardingState {
  completedAt: number | null;
  /** Set just before a language switch, so the tour resumes on the next step. */
  resumeStep: number | null;
  /** Not persisted: whether the tour is currently showing. */
  open: boolean;
  start: () => void;
  finish: () => void;
  clearResume: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      completedAt: null,
      resumeStep: null,
      open: false,
      start: () => set({ open: true }),
      finish: () => set({ open: false, completedAt: Date.now(), resumeStep: null }),
      clearResume: () => set({ resumeStep: null }),
    }),
    {
      name: "bible:onboarding",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ completedAt, resumeStep }) => ({ completedAt, resumeStep }),
    },
  ),
);
