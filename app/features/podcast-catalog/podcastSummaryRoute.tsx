import { fetchPodcastCatalog } from "@/features/podcast-catalog/api/fetchPodcastCatalog";
import type { Route } from "./+types/podcastSummaryRoute";
import { usePodcastCatalog } from "@/features/podcast-catalog/hooks/usePodcastCatalog";
import { PodcastGrid } from "@/features/podcast-catalog/components/podcastGrid";
import FilterInput from "@/features/podcast-catalog/components/filterInput";

export async function loader() {
  return fetchPodcastCatalog();
}

export default function PodcastCatalog({
  loaderData: initialData,
}: Route.ComponentProps) {
  const { podcasts, onFilterChange, searchValue } =
    usePodcastCatalog(initialData);
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-end gap-3">
        <ResultsBadge count={podcasts.length} />
        <FilterInput
          onFilterChange={onFilterChange}
          searchValue={searchValue}
        />
      </div>
      <PodcastGrid podcasts={podcasts} />
    </main>
  );
}

function ResultsBadge({ count }: { count: number }) {
  return (
    <output className="rounded-lg bg-brand-surface px-3 py-1.5 text-sm font-bold text-white">
      {count}
    </output>
  );
}
