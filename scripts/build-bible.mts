/**
 * Downloads public-domain Bible texts from eBible.org and writes one normalized
 * JSON file per book to data/bible/<translation>/<BOOK>.json.
 *
 * Usage: pnpm bible:build
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { BOOKS } from "../src/features/bible/canon.ts";

interface Source {
  translation: string;
  ebibleId: string;
}

const SOURCES: readonly Source[] = [
  { translation: "web", ebibleId: "engwebp" },
  { translation: "rv1909", ebibleId: "spaRV1909" },
];

type Verse = [number, string];

const OUTPUT_DIR = path.join(import.meta.dirname, "..", "data", "bible");
const LINE = /^(\w{3}) (\d+):(\d+)(?: (.*))?$/;

async function download(ebibleId: string): Promise<string> {
  const url = `https://ebible.org/Scriptures/${ebibleId}_vpl.zip`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);
  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const entry = archive[`${ebibleId}_vpl.txt`];
  if (!entry) throw new Error(`${ebibleId}_vpl.txt missing from archive`);
  return strFromU8(entry);
}

function parse(text: string): Map<string, Verse[][]> {
  const books = new Map<string, Verse[][]>();
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const match = LINE.exec(raw);
    if (!match) throw new Error(`Unrecognized line: ${raw}`);
    const [, code = "", chapter, verse, content = ""] = match;
    const chapters = books.get(code) ?? [];
    books.set(code, chapters);
    const verses = (chapters[Number(chapter) - 1] ??= []);
    const normalized = content.replace(/\s+/g, " ").trim();
    // Verses omitted by a translation (e.g. Luke 17:36 in the WEB) appear as empty lines.
    if (normalized) verses.push([Number(verse), normalized]);
  }
  return books;
}

async function build({ translation, ebibleId }: Source): Promise<void> {
  const parsed = parse(await download(ebibleId));
  const sourceCodes = [...parsed.keys()];
  if (sourceCodes.length !== BOOKS.length) {
    throw new Error(`${ebibleId}: expected ${BOOKS.length} books, got ${sourceCodes.length}`);
  }

  const dir = path.join(OUTPUT_DIR, translation);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  let verseCount = 0;
  // eBible VPL files list books in canonical order, so the n-th code is the n-th book.
  for (const [index, book] of BOOKS.entries()) {
    const chapters = parsed.get(sourceCodes[index] ?? "") ?? [];
    if (chapters.length !== book.chapters || chapters.some((c) => !c?.length)) {
      throw new Error(
        `${ebibleId} ${book.id}: expected ${book.chapters} chapters, got ${chapters.length}`,
      );
    }
    verseCount += chapters.reduce((sum, verses) => sum + verses.length, 0);
    await writeFile(path.join(dir, `${book.id}.json`), JSON.stringify({ book: book.id, chapters }));
  }
  console.log(`${translation}: ${BOOKS.length} books, ${verseCount} verses`);
}

for (const source of SOURCES) await build(source);
