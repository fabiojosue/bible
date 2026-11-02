/**
 * The 66-book Protestant canon shared by every translation we ship.
 * Self-contained (no imports) so the data build script can consume it directly.
 */

export type Testament = "old" | "new";

export type BookLanguage = "en" | "es";

export interface BookDefinition {
  /** USFM book identifier, stable across languages and translations. */
  readonly id: string;
  readonly testament: Testament;
  readonly chapters: number;
  readonly names: Readonly<Record<BookLanguage, string>>;
  /** Extra search terms that are not prefixes of a book name. */
  readonly aliases: readonly string[];
}

const book = (
  id: string,
  testament: Testament,
  chapters: number,
  en: string,
  es: string,
  aliases: readonly string[] = [],
): BookDefinition => ({ id, testament, chapters, names: { en, es }, aliases });

export const BOOKS: readonly BookDefinition[] = [
  book("GEN", "old", 50, "Genesis", "Génesis", ["gn"]),
  book("EXO", "old", 40, "Exodus", "Éxodo", ["ex"]),
  book("LEV", "old", 27, "Leviticus", "Levítico", ["lv"]),
  book("NUM", "old", 36, "Numbers", "Números", ["nm"]),
  book("DEU", "old", 34, "Deuteronomy", "Deuteronomio", ["dt"]),
  book("JOS", "old", 24, "Joshua", "Josué", ["jos"]),
  book("JDG", "old", 21, "Judges", "Jueces", ["jdg", "jue"]),
  book("RUT", "old", 4, "Ruth", "Rut", ["rt"]),
  book("1SA", "old", 31, "1 Samuel", "1 Samuel", ["1sm"]),
  book("2SA", "old", 24, "2 Samuel", "2 Samuel", ["2sm"]),
  book("1KI", "old", 22, "1 Kings", "1 Reyes", ["1kgs", "1re"]),
  book("2KI", "old", 25, "2 Kings", "2 Reyes", ["2kgs", "2re"]),
  book("1CH", "old", 29, "1 Chronicles", "1 Crónicas", ["1chr", "1cr"]),
  book("2CH", "old", 36, "2 Chronicles", "2 Crónicas", ["2chr", "2cr"]),
  book("EZR", "old", 10, "Ezra", "Esdras", ["ezr", "esd"]),
  book("NEH", "old", 13, "Nehemiah", "Nehemías", []),
  book("EST", "old", 10, "Esther", "Ester", ["est"]),
  book("JOB", "old", 42, "Job", "Job", []),
  book("PSA", "old", 150, "Psalms", "Salmos", ["ps", "psa", "psalm", "sal", "sl"]),
  book("PRO", "old", 31, "Proverbs", "Proverbios", ["prv", "pr"]),
  book("ECC", "old", 12, "Ecclesiastes", "Eclesiastés", ["ec", "qoh"]),
  book("SNG", "old", 8, "Song of Songs", "Cantares", ["sng", "sos", "songofsolomon", "cnt", "ct"]),
  book("ISA", "old", 66, "Isaiah", "Isaías", ["is"]),
  book("JER", "old", 52, "Jeremiah", "Jeremías", ["jr"]),
  book("LAM", "old", 5, "Lamentations", "Lamentaciones", ["lm"]),
  book("EZK", "old", 48, "Ezekiel", "Ezequiel", ["ezk", "ez"]),
  book("DAN", "old", 12, "Daniel", "Daniel", ["dn"]),
  book("HOS", "old", 14, "Hosea", "Oseas", []),
  book("JOL", "old", 3, "Joel", "Joel", ["jl"]),
  book("AMO", "old", 9, "Amos", "Amós", []),
  book("OBA", "old", 1, "Obadiah", "Abdías", ["ob"]),
  book("JON", "old", 4, "Jonah", "Jonás", ["jon"]),
  book("MIC", "old", 7, "Micah", "Miqueas", ["mi"]),
  book("NAM", "old", 3, "Nahum", "Nahúm", ["nam"]),
  book("HAB", "old", 3, "Habakkuk", "Habacuc", []),
  book("ZEP", "old", 3, "Zephaniah", "Sofonías", ["zep"]),
  book("HAG", "old", 2, "Haggai", "Hageo", ["hg"]),
  book("ZEC", "old", 14, "Zechariah", "Zacarías", ["zec"]),
  book("MAL", "old", 4, "Malachi", "Malaquías", []),
  book("MAT", "new", 28, "Matthew", "Mateo", ["mt"]),
  book("MRK", "new", 16, "Mark", "Marcos", ["mk", "mrk", "mr"]),
  book("LUK", "new", 24, "Luke", "Lucas", ["lk"]),
  book("JHN", "new", 21, "John", "Juan", ["jn", "jhn"]),
  book("ACT", "new", 28, "Acts", "Hechos", ["ac", "hch"]),
  book("ROM", "new", 16, "Romans", "Romanos", ["rm"]),
  book("1CO", "new", 16, "1 Corinthians", "1 Corintios", []),
  book("2CO", "new", 13, "2 Corinthians", "2 Corintios", []),
  book("GAL", "new", 6, "Galatians", "Gálatas", []),
  book("EPH", "new", 6, "Ephesians", "Efesios", []),
  book("PHP", "new", 4, "Philippians", "Filipenses", ["php", "phil", "flp"]),
  book("COL", "new", 4, "Colossians", "Colosenses", []),
  book("1TH", "new", 5, "1 Thessalonians", "1 Tesalonicenses", ["1th", "1ts"]),
  book("2TH", "new", 3, "2 Thessalonians", "2 Tesalonicenses", ["2th", "2ts"]),
  book("1TI", "new", 6, "1 Timothy", "1 Timoteo", ["1tm"]),
  book("2TI", "new", 4, "2 Timothy", "2 Timoteo", ["2tm"]),
  book("TIT", "new", 3, "Titus", "Tito", []),
  book("PHM", "new", 1, "Philemon", "Filemón", ["phm", "flm"]),
  book("HEB", "new", 13, "Hebrews", "Hebreos", []),
  book("JAS", "new", 5, "James", "Santiago", ["jas", "jm", "stg"]),
  book("1PE", "new", 5, "1 Peter", "1 Pedro", ["1pt"]),
  book("2PE", "new", 3, "2 Peter", "2 Pedro", ["2pt"]),
  book("1JN", "new", 5, "1 John", "1 Juan", ["1jn"]),
  book("2JN", "new", 1, "2 John", "2 Juan", ["2jn"]),
  book("3JN", "new", 1, "3 John", "3 Juan", ["3jn"]),
  book("JUD", "new", 1, "Jude", "Judas", ["jud", "jd"]),
  book("REV", "new", 22, "Revelation", "Apocalipsis", ["rv", "ap", "apoc"]),
];
