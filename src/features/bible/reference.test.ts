import { describe, expect, it } from "vitest";
import { formatReference, parseQuery, searchBooks } from "./reference";

const parsed = (input: string, locale: "en" | "es" = "en") => {
  const result = parseQuery(input, locale);
  return result && { book: result.book.id, chapter: result.chapter, verse: result.verse };
};

describe("parseQuery", () => {
  it.each([
    ["John 3:16", { book: "JHN", chapter: 3, verse: 16 }],
    ["jn3:16", { book: "JHN", chapter: 3, verse: 16 }],
    ["1 cor 13.4", { book: "1CO", chapter: 13, verse: 4 }],
    ["1co13", { book: "1CO", chapter: 13, verse: undefined }],
    ["Psalms 23", { book: "PSA", chapter: 23, verse: undefined }],
    ["ps 119:105", { book: "PSA", chapter: 119, verse: 105 }],
    ["Song of Songs 2", { book: "SNG", chapter: 2, verse: undefined }],
    ["rev", { book: "REV", chapter: undefined, verse: undefined }],
    ["  genesis   1 : 1 ", { book: "GEN", chapter: 1, verse: 1 }],
  ])("parses %s in English", (input, expected) => {
    expect(parsed(input)).toEqual(expected);
  });

  it.each([
    ["Juan 3:16", { book: "JHN", chapter: 3, verse: 16 }],
    ["génesis 1", { book: "GEN", chapter: 1, verse: undefined }],
    ["genesis 1", { book: "GEN", chapter: 1, verse: undefined }],
    ["Éxodo 20", { book: "EXO", chapter: 20, verse: undefined }],
    ["1 juan 4:8", { book: "1JN", chapter: 4, verse: 8 }],
    ["Salmos 23", { book: "PSA", chapter: 23, verse: undefined }],
    ["Apocalipsis 21", { book: "REV", chapter: 21, verse: undefined }],
    ["stg 1:5", { book: "JAS", chapter: 1, verse: 5 }],
  ])("parses %s in Spanish", (input, expected) => {
    expect(parsed(input, "es")).toEqual(expected);
  });

  it("accepts the other language's book names", () => {
    expect(parsed("Juan 1", "en")?.book).toBe("JHN");
    expect(parsed("John 1", "es")?.book).toBe("JHN");
  });

  it.each(["", "   ", "3:16", "xyz 1", "John 22", "Obadiah 2", "John 0"])("rejects %j", (input) => {
    expect(parseQuery(input, "en")).toBeUndefined();
  });

  it("prefers the current locale when a prefix is ambiguous", () => {
    // "jo" prefixes Job, Joel, Jonah, John... canonical order wins in English.
    expect(parsed("jo")?.book).toBe("JOS");
    expect(searchBooks("jud", "en").map((book) => book.id)).toEqual(["JUD", "JDG"]);
  });
});

describe("formatReference", () => {
  it("formats in both languages", () => {
    expect(formatReference({ bookId: "JHN", chapter: 3, verse: 16 }, "en")).toBe("John 3:16");
    expect(formatReference({ bookId: "JHN", chapter: 3 }, "es")).toBe("Juan 3");
  });
});
