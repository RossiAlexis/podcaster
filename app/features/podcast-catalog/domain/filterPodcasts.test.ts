import { describe, expect, test } from "vitest";

import type { PodcastSummary } from "@/features/podcast-catalog/domain/podcastSummary";
import { filterPodcasts } from "@/features/podcast-catalog/domain/filterPodcasts";

const podcasts: PodcastSummary[] = [
  {
    id: "syntax",
    title: "Syntax",
    author: "Wes Bos and Scott Tolinski",
    artworkUrl: "https://example.com/syntax.jpg",
    description: "A web development podcast",
    genre: "Technology",
  },
  {
    id: "daily",
    title: "The Daily",
    author: "The New York Times",
    artworkUrl: "https://example.com/daily.jpg",
    description: "Daily news",
    genre: "News",
  },
];

describe("filterPodcasts", () => {
  test.each([null, "", "   "])(
    "returns the complete catalog when search is %j",
    (search) => {
      expect(filterPodcasts(podcasts, search)).toEqual(podcasts);
    },
  );

  test("matches titles without regard to case or surrounding whitespace", () => {
    expect(filterPodcasts(podcasts, "  SyNtAx ")).toEqual([podcasts[0]]);
  });

  test("matches authors", () => {
    expect(filterPodcasts(podcasts, "new york")).toEqual([podcasts[1]]);
  });

  test("returns an empty catalog when nothing matches", () => {
    expect(filterPodcasts(podcasts, "history")).toEqual([]);
  });
});
