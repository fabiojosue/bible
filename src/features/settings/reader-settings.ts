/**
 * Reader preferences and how they map to CSS. Shared by the store and the
 * pre-paint script so the first frame already uses the reader's settings.
 */

export const LINE_HEIGHTS = ["compact", "normal", "relaxed"] as const;
export const WIDTHS = ["narrow", "normal", "wide"] as const;
export const FONTS = ["serif", "sans"] as const;

export type LineHeight = (typeof LINE_HEIGHTS)[number];
export type Width = (typeof WIDTHS)[number];
export type Font = (typeof FONTS)[number];

export interface ReaderSettings {
  fontSize: number;
  lineHeight: LineHeight;
  width: Width;
  font: Font;
  verseNumbers: boolean;
  parallel: boolean;
}

export const FONT_SIZE = { min: 14, max: 28, step: 1 } as const;

export const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 19,
  lineHeight: "normal",
  width: "normal",
  font: "serif",
  verseNumbers: true,
  parallel: false,
};

export const SETTINGS_STORAGE_KEY = "bible:settings";

const LINE_HEIGHT_VALUES: Record<LineHeight, string> = {
  compact: "1.6",
  normal: "1.85",
  relaxed: "2.1",
};

const WIDTH_VALUES: Record<Width, string> = {
  narrow: "34rem",
  normal: "40rem",
  wide: "48rem",
};

/** Applies settings to `<html>` as CSS custom properties and data attributes. */
export function applyReaderSettings(settings: ReaderSettings, root: HTMLElement): void {
  root.style.setProperty("--reader-font-size", `${settings.fontSize}px`);
  root.style.setProperty("--reader-line-height", LINE_HEIGHT_VALUES[settings.lineHeight]);
  root.style.setProperty("--reader-width", WIDTH_VALUES[settings.width]);
  root.dataset.readerFont = settings.font;
  root.dataset.verseNumbers = String(settings.verseNumbers);
}

/**
 * Inline script that mirrors `applyReaderSettings` before first paint.
 * It is serialized into the document head, so it cannot reference module scope.
 */
export const READER_SETTINGS_SCRIPT = `(() => {
  try {
    const d = ${JSON.stringify(DEFAULT_SETTINGS)};
    const lh = ${JSON.stringify(LINE_HEIGHT_VALUES)};
    const w = ${JSON.stringify(WIDTH_VALUES)};
    const stored = JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_STORAGE_KEY)}) || "null");
    const s = Object.assign({}, d, stored && stored.state);
    const r = document.documentElement;
    r.style.setProperty("--reader-font-size", s.fontSize + "px");
    r.style.setProperty("--reader-line-height", lh[s.lineHeight] || lh[d.lineHeight]);
    r.style.setProperty("--reader-width", w[s.width] || w[d.width]);
    r.dataset.readerFont = s.font;
    r.dataset.verseNumbers = String(s.verseNumbers);
  } catch (e) {}
})();`;
