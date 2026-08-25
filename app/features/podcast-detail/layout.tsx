import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

import { PodcastDetailSkeleton } from "@/features/podcast-detail/components/PodcastDetailSkeleton";
import { usePodcastDetail } from "@/features/podcast-detail/hooks/usePodcastDetail";
import { AppLink } from "@/shared/navigation/AppLink";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Podcast ${params.podcastId} | Podcaster` }];
}

export default function PodcastRoute() {
  const { podcast, isPending, isError } = usePodcastDetail();

  if (isPending) {
    return <PodcastDetailSkeleton />;
  }

  if (isError || !podcast) {
    return (
      <p className="rounded-lg bg-red-50 p-4 text-red-700" role="alert">
        We could not load this podcast.
      </p>
    );
  }

  const podcastPath = `/podcast/${podcast.id}`;

  return (
    <div>
      <main className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[18rem_1fr]">
        <aside className="h-fit rounded-lg border border-slate-200 bg-surface p-5 shadow-card">
          <AppLink to={podcastPath} viewTransition>
            <img
              alt={`${podcast.title} artwork`}
              className="mx-auto aspect-square w-full max-w-64 rounded-md object-cover"
              src={podcast.artworkUrl}
              style={{ viewTransitionName: "podcast-artwork" }}
            />
          </AppLink>
          <div className="my-5 border-y border-slate-200 py-4">
            <h2 className="font-bold text-slate-900">
              <AppLink to={podcastPath}>{podcast.title}</AppLink>
            </h2>
            <p className="mt-1 text-sm italic text-slate-600">
              by <AppLink to={podcastPath}>{podcast.author}</AppLink>
            </p>
          </div>
          {podcast.description && (
            <>
              <h3 className="text-sm font-bold">Description:</h3>
              <p className="mt-2 whitespace-pre-line text-sm italic leading-6 text-slate-600">
                {podcast.description}
              </p>
            </>
          )}
        </aside>
        <Outlet />
      </main>
    </div>
  );
}
