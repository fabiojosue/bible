import { BOOKS } from "@/features/bible/books";
import { getChapter } from "@/features/bible/data";
import { isTranslationId, TRANSLATION_IDS } from "@/features/bible/translations";

/** Static JSON per chapter, used by the side-by-side view. */
export function generateStaticParams() {
  return TRANSLATION_IDS.flatMap((translation) =>
    BOOKS.flatMap((book) =>
      Array.from({ length: book.chapters }, (_, index) => ({
        translation,
        book: book.id,
        chapter: String(index + 1),
      })),
    ),
  );
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/chapters/[translation]/[book]/[chapter]">,
) {
  const { translation, book, chapter } = await params;
  const content = isTranslationId(translation)
    ? await getChapter(translation, book, Number(chapter))
    : undefined;
  if (!content) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(content);
}
