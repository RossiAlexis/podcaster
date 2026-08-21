import { useQuery } from "@tanstack/react-query";
import type { PodcastSummary } from "@/features/podcast-catalog/domain/podcastSummary";
import { fetchPodcastCatalog } from "@/features/podcast-catalog/api/fetchPodcastCatalog";
import { useSearchParams } from "react-router";
import { useMemo } from "react";
import { filterPodcasts } from "@/features/podcast-catalog/domain/filterPodcasts";

const ONE_DAY = 24 * 60 * 60 * 1000;
const catalogQueryKey = ["podcast-catalog"] as const;

export function usePodcastCatalog(initialData?: PodcastSummary[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useQuery({
    queryKey: catalogQueryKey,
    queryFn: fetchPodcastCatalog,
    staleTime: ONE_DAY,
    refetchInterval: ONE_DAY,
    initialData: initialData,
  });

  const podcasts = useMemo(
    () => filterPodcasts(query.data ?? [], searchParams.get("search")),
    [query.data, searchParams],
  );

  const onFilterChange = (search: string) => {
    if (!search) {
      setSearchParams(new URLSearchParams());
    } else {
      const isFirstSearch = searchParams.get("search") === null;
      const params = new URLSearchParams();
      params.set("search", search);
      setSearchParams(params, {
        replace: !isFirstSearch,
      });
    }
  };

  return {
    podcasts,
    onFilterChange,
    searchValue: searchParams.get("search") || "",
  };
}
