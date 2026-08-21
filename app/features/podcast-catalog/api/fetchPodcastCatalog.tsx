import { z } from "zod";

import type { PodcastSummary } from "@/features/podcast-catalog/domain/podcastSummary";

const imageSchema = z.object({ label: z.string() });
const entrySchema = z
  .object({
    id: z.object({ attributes: z.object({ "im:id": z.string() }) }),
    "im:name": z.object({ label: z.string() }),
    "im:artist": z.object({ label: z.string() }),
    "im:image": z.array(imageSchema).min(1),
    summary: z.object({ label: z.string() }),
    category: z.object({
      attributes: z.object({ label: z.string() }),
    }),
  })
  .transform(
    (entry) =>
      ({
        id: entry.id.attributes["im:id"],
        title: entry["im:name"].label,
        author: entry["im:artist"].label,
        artworkUrl: entry["im:image"].at(-1)?.label ?? "",
        description: entry.summary.label,
        genre: entry.category.attributes.label,
      }) satisfies PodcastSummary,
  );

export const catalogResponseSchema = z
  .object({ feed: z.object({ entry: z.array(entrySchema) }) })
  .transform(({ feed }) => feed.entry);

const CATALOG_URL =
  "https://itunes.apple.com/us/rss/toppodcasts/limit=100/genre=1310/json";

export async function fetchPodcastCatalog(): Promise<PodcastSummary[]> {
  const response = await fetch(CATALOG_URL);
  if (!response.ok) {
    throw new Error(`Catalog request failed (${response.status})`);
  }

  return catalogResponseSchema.parse(await response.json());
}
