import DOMPurify from "dompurify";
import { useMemo } from "react";

const DESCRIPTION_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "code",
  "pre",
] as const;

export function EpisodeDescription({ html }: { html: string }) {
  const sanitizedHtml = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [...DESCRIPTION_TAGS],
        ALLOWED_ATTR: ["href", "title"],
        ALLOW_ARIA_ATTR: false,
        ALLOW_DATA_ATTR: false,
      }),
    [html],
  );

  return (
    <div
      className="episode-description max-w-none text-sm italic leading-7"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
