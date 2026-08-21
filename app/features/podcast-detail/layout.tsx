import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { PodcastDetailSkeleton } from "./components/PodcastDetailSkeleton";
import { usePodcastDetail } from "./hooks/usePodcastDetail";

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

  return (
    <main className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[18rem_1fr]">
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <img
          alt={`${podcast.title} artwork`}
          className="mx-auto aspect-square w-full max-w-64 rounded-md object-cover"
          src={podcast.artworkUrl}
        />
        <div className="my-5 border-y border-slate-200 py-4">
          <h2 className="font-bold text-slate-900">{podcast.title}</h2>
          <p className="mt-1 text-sm italic text-slate-600">
            by {podcast.author}
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
  );
}
