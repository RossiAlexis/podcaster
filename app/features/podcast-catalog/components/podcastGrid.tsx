import { AppLink } from "@/shared/navigation/AppLink";
import type { PodcastSummary } from "@/features/podcast-catalog/domain/podcastSummary";
import { useViewTransitionState } from "react-router";

export function PodcastGrid({
  podcasts,
}: {
  podcasts: readonly PodcastSummary[];
}) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {podcasts.map((podcast) => (
        <PodcastCard key={podcast.id} podcast={podcast} />
      ))}
    </div>
  );
}
function PodcastCard({ podcast }: { podcast: PodcastSummary }) {
  const href = `/podcast/${podcast.id}`;
  const isTransitioning = useViewTransitionState(href);

  return (
    <AppLink
      className="group mt-16 flex min-h-48 flex-col items-center rounded-lg border border-slate-200 bg-white px-5 pb-5 text-center shadow-card transition hover:-translate-y-1 hover:shadow-lg"
      to={href}
      viewTransition
    >
      <img
        alt=""
        className="-mt-16 size-32 rounded-full object-cover shadow-md transition group-hover:scale-105"
        height={128}
        loading="lazy"
        src={podcast.artworkUrl}
        style={{
          viewTransitionName: isTransitioning ? "podcast-artwork" : "none",
        }}
        width={128}
      />
      <h2 className="mt-5 line-clamp-2 font-bold uppercase leading-tight text-slate-900">
        {podcast.title}
      </h2>
      <p className="mt-2 text-sm text-slate-500">Author: {podcast.author}</p>
    </AppLink>
  );
}
