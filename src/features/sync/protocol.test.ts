import { describe, expect, it } from "vitest";
import { marksChangedSince, mergeMarks, newerPosition } from "./protocol";

describe("mergeMarks", () => {
  it("keeps the newer mark per chapter", () => {
    const current = { "JHN.1": { read: true, at: 10 }, "JHN.2": { read: true, at: 30 } };
    const incoming = { "JHN.1": { read: false, at: 20 }, "JHN.2": { read: false, at: 25 } };
    expect(mergeMarks(current, incoming)).toEqual({
      "JHN.1": { read: false, at: 20 },
      "JHN.2": { read: true, at: 30 },
    });
  });

  it("adds chapters only one side knows about", () => {
    expect(
      mergeMarks({ "GEN.1": { read: true, at: 1 } }, { "EXO.1": { read: true, at: 2 } }),
    ).toEqual({
      "GEN.1": { read: true, at: 1 },
      "EXO.1": { read: true, at: 2 },
    });
  });

  it("returns the same object when nothing changes", () => {
    const current = { "GEN.1": { read: true, at: 5 } };
    expect(mergeMarks(current, { "GEN.1": { read: false, at: 5 } })).toBe(current);
    expect(mergeMarks(current, {})).toBe(current);
  });
});

describe("newerPosition", () => {
  const older = { position: { bookId: "GEN", chapter: 1, verse: 1 }, at: 1 };
  const newer = { position: null, at: 2 };

  it("prefers the newer record, including a cleared one", () => {
    expect(newerPosition(older, newer)).toBe(newer);
    expect(newerPosition(newer, older)).toBe(newer);
  });

  it("falls back to whichever side exists", () => {
    expect(newerPosition(null, older)).toBe(older);
    expect(newerPosition(older, undefined)).toBe(older);
    expect(newerPosition(null, null)).toBeNull();
  });
});

describe("marksChangedSince", () => {
  it("returns only marks after the given time", () => {
    const marks = { "GEN.1": { read: true, at: 5 }, "GEN.2": { read: false, at: 9 } };
    expect(marksChangedSince(marks, 5)).toEqual({ "GEN.2": { read: false, at: 9 } });
    expect(marksChangedSince(marks, 0)).toEqual(marks);
  });
});
