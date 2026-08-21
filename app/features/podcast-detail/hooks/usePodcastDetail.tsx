import { useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PodcastSummary } from "@/features/podcast-catalog/domain/podcastSummary";
import { fetchPodcastDetail } from "../api/fetchPodcastDetail";
import type { PodcastDetail } from "../domain/podcastDetail";

type Podcast = PodcastDetail & { description?: string };

export function usePodcastDetail(initialData?: PodcastDetail) {
  const params = useParams();
  const podcastId = params.podcastId ?? "";
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ["podcast-detail", podcastId],
    queryFn: () => fetchPodcastDetail(podcastId),
    initialData,
  });

  const catalog = queryClient.getQueryData<PodcastSummary[]>([
    "podcast-catalog",
  ]);
  const catalogPodcast = catalog?.find((item) => item.id === podcastId);

  const podcast: Podcast | undefined = detailQuery.data
    ? {
        ...detailQuery.data,
        ...(catalogPodcast?.description && {
          description: catalogPodcast.description,
        }),
      }
    : undefined;

  return {
    ...detailQuery,
    podcast,
    episodes: podcast?.episodes ?? [],
  };
}
