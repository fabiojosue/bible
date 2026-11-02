import { Fragment } from "react";

/**
 * Renders verse text. Translators' supplied words are bracketed in the source
 * (e.g. Reina-Valera "[es]") and shown in italics, the traditional convention.
 */
export function VerseText({ text }: { text: string }) {
  const parts = text.split(/\[([^\]]+)\]/);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <em key={index} className="italic opacity-90">
        {part}
      </em>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}
