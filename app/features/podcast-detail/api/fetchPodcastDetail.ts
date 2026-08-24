import { z } from "zod";

import type { PodcastDetail } from "@/features/podcast-detail/domain/podcastDetail";
import type { Episode } from "@/features/podcast-detail/episode/domain/episode";

const podcastCollectionSchema = z.object({
  kind: z.literal("podcast"),
  collectionId: z.number(),
  artistName: z.string(),
  trackName: z.string(),
  artworkUrl600: z.url(),
  primaryGenreName: z.string(),
  feedUrl: z.url(),
});

const podcastEpisodeSchema = z.object({
  kind: z.literal("podcast-episode"),
  trackId: z.number(),
  episodeGuid: z.string(),
  trackName: z.string(),
  releaseDate: z.iso.datetime(),
  trackTimeMillis: z.number().optional(),
  episodeUrl: z.url(),
  description: z.string().optional(),
});

const podcastLookupResultSchema = z.discriminatedUnion("kind", [
  podcastCollectionSchema,
  podcastEpisodeSchema,
]);

const episodeResponseSchema = z.object({
  results: z.array(z.unknown()),
});

type PodcastDetailResponse = z.infer<typeof episodeResponseSchema>;

function toEpisode(raw: z.infer<typeof podcastEpisodeSchema>): Episode {
  return {
    id: raw.trackId,
    guid: raw.episodeGuid,
    title: raw.trackName,
    releaseDate: raw.releaseDate,
    audioUrl: raw.episodeUrl,
    ...(raw.trackTimeMillis != null && { duration: raw.trackTimeMillis }),
    ...(raw.description !== undefined && { description: raw.description }),
  };
}

function toPodcastDetail(response: PodcastDetailResponse): PodcastDetail {
  let podcast: z.infer<typeof podcastCollectionSchema> | undefined;
  const episodes: Episode[] = [];

  response.results.forEach((rawResult, index) => {
    const result = podcastLookupResultSchema.safeParse(rawResult);

    if (!result.success) {
      console.error("Discarding invalid podcast lookup result", {
        index,
        issues: result.error.issues,
      });
      return;
    }

    if (result.data.kind === "podcast") {
      podcast = result.data;
      return;
    }

    episodes.push(toEpisode(result.data));
  });

  if (!podcast) {
    console.error("Podcast collection not found in lookup response");
    throw new Error("Podcast collection not found in lookup response");
  }

  return {
    id: String(podcast.collectionId),
    title: podcast.trackName,
    author: podcast.artistName,
    artworkUrl: podcast.artworkUrl600,
    genre: podcast.primaryGenreName,
    feedUrl: podcast.feedUrl,
    episodes,
  } satisfies PodcastDetail;
}

export async function fetchPodcastDetail(
  podcastId: string,
): Promise<PodcastDetail> {
  const url = new URL("https://itunes.apple.com/lookup");
  url.search = new URLSearchParams({
    id: podcastId,
    media: "podcast",
    entity: "podcastEpisode",
    limit: "200",
  }).toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Episodes request failed (${response.status})`);
  }

  let rawResponse: unknown;
  try {
    rawResponse = await response.json();
  } catch (error) {
    console.error("Podcast detail response is not valid JSON", error);
    throw error;
  }

  const parsedResponse = episodeResponseSchema.safeParse(rawResponse);
  if (!parsedResponse.success) {
    console.error(
      "Invalid podcast detail response",
      parsedResponse.error.issues,
    );
    throw parsedResponse.error;
  }

  return toPodcastDetail(parsedResponse.data);
}
