"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_SETTINGS,
  FONT_SIZE,
  type ReaderSettings,
  SETTINGS_STORAGE_KEY,
} from "./reader-settings";

interface SettingsActions {
  update: (patch: Partial<ReaderSettings>) => void;
  changeFontSize: (delta: number) => void;
  toggleParallel: () => void;
}

const clampFontSize = (value: number) =>
  Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, Math.round(value)));

export const useSettings = create<ReaderSettings & SettingsActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) =>
        set((state) => ({
          ...patch,
          fontSize: clampFontSize(patch.fontSize ?? state.fontSize),
        })),
      changeFontSize: (delta) =>
        set((state) => ({ fontSize: clampFontSize(state.fontSize + delta) })),
      toggleParallel: () => set((state) => ({ parallel: !state.parallel })),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ fontSize, lineHeight, width, font, verseNumbers, parallel }) => ({
        fontSize,
        lineHeight,
        width,
        font,
        verseNumbers,
        parallel,
      }),
    },
  ),
);
