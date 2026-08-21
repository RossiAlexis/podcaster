import type { PodcastSummary } from "@/features/podcast-catalog/domain/podcastSummary";

export const filterPodcasts = (
  podcasts: readonly PodcastSummary[],
  search: string | null,
) => {
  if (!search) return [...podcasts];
  const normalizedSearch = search.trim().toLocaleLowerCase();
  if (!normalizedSearch) return [...podcasts];

  return podcasts.filter(
    ({ title, author }) =>
      title.toLocaleLowerCase().includes(normalizedSearch) ||
      author.toLocaleLowerCase().includes(normalizedSearch),
  );
};
