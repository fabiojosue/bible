import { describe, expect, it } from "vitest";
import { adjacentChapter, BOOKS, bookSlug, getBookBySlug, TOTAL_CHAPTERS } from "./books";
import { chapterPath, localizePath, parsePath } from "./routes";

describe("canon", () => {
  it("has 66 books and 1189 chapters", () => {
    expect(BOOKS).toHaveLength(66);
    expect(TOTAL_CHAPTERS).toBe(1189);
  });

  it("has unique slugs per locale that round-trip", () => {
    for (const locale of ["en", "es"] as const) {
      const slugs = BOOKS.map((book) => bookSlug(book, locale));
      expect(new Set(slugs).size).toBe(BOOKS.length);
      for (const book of BOOKS) expect(getBookBySlug(bookSlug(book, locale), locale)).toBe(book);
    }
  });

  it("produces ASCII slugs", () => {
    expect(
      bookSlug(
        BOOKS.find((b) => b.id === "EXO")!,
        "es",
      ),
    ).toBe("exodo");
    expect(
      bookSlug(
        BOOKS.find((b) => b.id === "1CO")!,
        "en",
      ),
    ).toBe("1-corinthians");
    expect(
      bookSlug(
        BOOKS.find((b) => b.id === "SNG")!,
        "en",
      ),
    ).toBe("song-of-songs");
  });
});

describe("adjacentChapter", () => {
  it("moves within a book", () => {
    expect(adjacentChapter({ bookId: "JHN", chapter: 3 }, 1)).toEqual({
      bookId: "JHN",
      chapter: 4,
    });
  });

  it("crosses book boundaries", () => {
    expect(adjacentChapter({ bookId: "GEN", chapter: 50 }, 1)).toEqual({
      bookId: "EXO",
      chapter: 1,
    });
    expect(adjacentChapter({ bookId: "EXO", chapter: 1 }, -1)).toEqual({
      bookId: "GEN",
      chapter: 50,
    });
    expect(adjacentChapter({ bookId: "MAL", chapter: 4 }, 1)).toEqual({
      bookId: "MAT",
      chapter: 1,
    });
  });

  it("stops at the ends of the Bible", () => {
    expect(adjacentChapter({ bookId: "GEN", chapter: 1 }, -1)).toBeUndefined();
    expect(adjacentChapter({ bookId: "REV", chapter: 22 }, 1)).toBeUndefined();
  });
});

describe("paths", () => {
  it("builds localized chapter paths with verse anchors", () => {
    expect(chapterPath({ bookId: "JHN", chapter: 3, verse: 16 }, "en")).toBe("/john/3#v16");
    expect(chapterPath({ bookId: "JHN", chapter: 3 }, "es")).toBe("/juan/3");
  });

  it("parses paths and rejects invalid ones", () => {
    expect(parsePath("/juan/3", "es")).toMatchObject({ book: { id: "JHN" }, chapter: 3 });
    expect(parsePath("/john", "en")).toMatchObject({ book: { id: "JHN" } });
    expect(parsePath("/juan/3", "en")).toBeUndefined();
    expect(parsePath("/john/99", "en")).toBeUndefined();
    expect(parsePath("/john/3/extra", "en")).toBeUndefined();
    expect(parsePath("/", "en")).toBeUndefined();
  });

  it("translates paths between languages", () => {
    expect(localizePath("/john/3", "en", "es")).toBe("/juan/3");
    expect(localizePath("/exodo", "es", "en")).toBe("/exodus");
    expect(localizePath("/", "en", "es")).toBe("/");
  });
});
