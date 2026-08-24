import { XMLParser } from "fast-xml-parser";

import { FeedEnrichmentError } from "@/features/podcast-detail/episode/api/errors";
import {
  feedItemsSchema,
  type FeedItem,
  normalizeTitle,
} from "@/features/podcast-detail/episode/api/schema";
import type { Episode } from "@/features/podcast-detail/episode/domain/episode";

const ALL_ORIGINS_URL = "https://api.allorigins.win/raw";
const FEED_REQUEST_TIMEOUT_MS = 8_000;

const parser = new XMLParser({
  ignoreAttributes: false,
  cdataPropName: "__cdata",
});

function parseFeedItems(xml: string): FeedItem[] {
  let parsedFeed: unknown;
  try {
    parsedFeed = parser.parse(xml);
  } catch (error) {
    throw new FeedEnrichmentError("Unable to parse podcast feed XML", error);
  }

  const parsedItems = feedItemsSchema.safeParse(parsedFeed);
  if (!parsedItems.success) {
    throw new FeedEnrichmentError("Invalid RSS feed structure", {
      issues: parsedItems.error.issues,
    });
  }

  return parsedItems.data;
}

function findEpisodeItem(
  items: readonly FeedItem[],
  episode: Episode,
): FeedItem | undefined {
  return (
    items.find((item) => item.guid === episode.guid) ??
    items.find((item) => item.audioUrl === episode.audioUrl) ??
    items.find((item) => item.normalizedTitle === normalizeTitle(episode.title))
  );
}

function extractEpisodeDescriptionFromItems(
  items: readonly FeedItem[],
  episode: Episode,
): string | undefined {
  return findEpisodeItem(items, episode)?.description;
}

async function requestFeed(url: string): Promise<string> {
  const timeoutController = new AbortController();
  const timeout = setTimeout(
    () => timeoutController.abort(),
    FEED_REQUEST_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(url, {
      signal: timeoutController.signal,
    });
  } catch (error) {
    throw new FeedEnrichmentError(
      `Podcast feed request failed for ${url}`,
      error,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new FeedEnrichmentError(
      `Podcast feed request failed (${response.status})`,
    );
  }

  return response.text();
}

async function fetchFeed(feedUrl: string): Promise<string> {
  try {
    return await requestFeed(feedUrl);
  } catch (error) {
    console.error("Direct podcast feed request failed. Retrying with proxy.", {
      feedUrl,
      error,
    });
    const proxyUrl = new URL(ALL_ORIGINS_URL);
    proxyUrl.searchParams.set("url", feedUrl);

    return requestFeed(proxyUrl.toString());
  }
}

export async function fetchEpisodeFromFeed(
  feedUrl: string,
  episode: Episode,
): Promise<Episode> {
  try {
    const description = extractEpisodeDescriptionFromItems(
      parseFeedItems(await fetchFeed(feedUrl)),
      episode,
    );
    if (!description) {
      return episode;
    }

    return {
      ...episode,
      description,
    };
  } catch (error) {
    if (error instanceof FeedEnrichmentError) {
      console.error("Episode enrichment from RSS failed; using lookup data.", {
        feedUrl,
        episodeId: episode.id,
        error,
      });
      return episode;
    }

    throw error;
  }
}
