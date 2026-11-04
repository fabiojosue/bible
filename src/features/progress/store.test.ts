import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { positionRecordOf, useProgress } from "./store";

const initial = useProgress.getState();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
  useProgress.setState(initial, true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("progress store", () => {
  it("keeps an unread mark so the change can sync", () => {
    useProgress.getState().markRead("JHN", 1);
    vi.setSystemTime(2000);
    useProgress.getState().setRead("JHN", 1, false);
    const state = useProgress.getState();
    expect(state.marks["JHN.1"]).toEqual({ read: false, at: 2000 });
    expect(state.readChapters).toEqual({});
  });

  it("reset leaves timestamped tombstones and clears the position", () => {
    const store = useProgress.getState();
    store.markRead("GEN", 1);
    store.savePosition({ bookId: "GEN", chapter: 2, verse: 4 });
    vi.setSystemTime(5000);
    useProgress.getState().reset();
    const state = useProgress.getState();
    expect(state.marks).toEqual({ "GEN.1": { read: false, at: 5000 } });
    expect(positionRecordOf(state)).toEqual({ position: null, at: 5000 });
  });

  it("applies newer remote changes and ignores older ones", () => {
    useProgress.getState().markRead("GEN", 1);
    useProgress.getState().savePosition({ bookId: "GEN", chapter: 1, verse: 3 });
    useProgress.getState().applyRemote({
      marks: { "GEN.1": { read: false, at: 500 }, "EXO.2": { read: true, at: 1500 } },
      position: { position: { bookId: "EXO", chapter: 2, verse: 7 }, at: 1500 },
    });
    const state = useProgress.getState();
    expect(state.readChapters).toEqual({ "GEN.1": 1000, "EXO.2": 1500 });
    expect(state.lastPosition).toEqual({ bookId: "EXO", chapter: 2, verse: 7, updatedAt: 1500 });
  });

  it("saves a verse and keeps a tombstone when it is removed", () => {
    useProgress
      .getState()
      .setVerseSaved("JHN.3.16", true, { text: "For God so loved", translation: "web" });
    vi.setSystemTime(2000);
    useProgress.getState().setVerseSaved("JHN.3.16", false);
    expect(useProgress.getState().verses["JHN.3.16"]).toEqual({
      saved: false,
      at: 2000,
      text: "For God so loved",
      translation: "web",
    });
  });

  it("does not change state when the remote has nothing newer", () => {
    useProgress.getState().markRead("GEN", 1);
    const before = useProgress.getState();
    before.applyRemote({ marks: { "GEN.1": { read: false, at: 1 } }, position: null });
    expect(useProgress.getState()).toBe(before);
  });
});
