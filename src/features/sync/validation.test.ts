import { describe, expect, it } from "vitest";
import { parseSyncRequest } from "./validation";

const NOW = 1_800_000_000_000;

describe("parseSyncRequest", () => {
  it("accepts marks and a position", () => {
    const body = {
      marks: { "JHN.3": { read: true, at: NOW }, "PSA.150": { read: false, at: NOW - 1 } },
      position: { position: { bookId: "JHN", chapter: 3, verse: 16 }, at: NOW },
    };
    expect(parseSyncRequest(body, NOW)).toEqual({ ...body, verses: {} });
  });

  it("accepts a saved verse and rejects a bad one", () => {
    const save = { saved: true, at: NOW, text: "For God so loved the world", translation: "web" };
    expect(parseSyncRequest({ marks: {}, verses: { "JHN.3.16": save } }, NOW)?.verses).toEqual({
      "JHN.3.16": save,
    });
    expect(parseSyncRequest({ marks: {}, verses: { "JHN.99.1": save } }, NOW)).toBeUndefined();
  });

  it("accepts an empty push and a cleared position", () => {
    expect(parseSyncRequest({ marks: {} }, NOW)).toEqual({ marks: {}, verses: {} });
    expect(
      parseSyncRequest({ marks: {}, position: { position: null, at: NOW } }, NOW),
    ).toBeDefined();
  });

  it.each([
    ["a non-object", "nope"],
    ["missing marks", {}],
    ["an unknown book", { marks: { "XYZ.1": { read: true, at: NOW } } }],
    ["a chapter past the end", { marks: { "JHN.22": { read: true, at: NOW } } }],
    ["a non-canonical key", { marks: { "JHN.03": { read: true, at: NOW } } }],
    ["a far-future mark", { marks: { "JHN.1": { read: true, at: NOW + 60 * 60 * 1000 } } }],
    ["a fractional time", { marks: { "JHN.1": { read: true, at: 1.5 } } }],
    [
      "an invalid position",
      { marks: {}, position: { position: { bookId: "JHN", chapter: 99, verse: 1 }, at: NOW } },
    ],
  ])("rejects %s", (_, body) => {
    expect(parseSyncRequest(body, NOW)).toBeUndefined();
  });
});
