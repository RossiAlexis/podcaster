import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { fetchEpisodeFromFeed } from "@/features/podcast-detail/episode/api/fetchEpisodeFromFeed";
import { usePodcastDetail } from "@/features/podcast-detail/hooks/usePodcastDetail";

function parseEpisodeId(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const episodeId = Number(value);
  return Number.isSafeInteger(episodeId) ? episodeId : undefined;
}

export function useEpisode() {
  const { podcastId = "", episodeId: rawEpisodeId } = useParams();
  const episodeId = parseEpisodeId(rawEpisodeId);
  const podcastQuery = usePodcastDetail();
  const episode = podcastQuery.episodes.find((item) => item.id === episodeId);

  const episodeQuery = useQuery({
    queryKey: ["podcast-episode", podcastId, episodeId],
    queryFn: () => {
      if (!podcastQuery.podcast || !episode) {
        throw new Error("Episode data is unavailable");
      }

      return fetchEpisodeFromFeed(podcastQuery.podcast.feedUrl, episode);
    },
    enabled: Boolean(podcastQuery.podcast && episode),
  });

  const episodeIsMissing =
    !podcastQuery.isPending &&
    !podcastQuery.isError &&
    (!episodeId || !episode);

  return {
    ...episodeQuery,
    episode: episodeQuery.data,
    isPending:
      podcastQuery.isPending || (Boolean(episode) && episodeQuery.isPending),
    isError: podcastQuery.isError || episodeIsMissing || episodeQuery.isError,
  };
}
