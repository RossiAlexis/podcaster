import { usePodcastDetail } from "./hooks/usePodcastDetail";
import { EpisodeTable } from "./components/EpisodeTable";
import { EpisodeListSkeleton } from "./components/PodcastDetailSkeleton";

export default function PodcastDetailRoute() {
  const { episodes, isPending, isError } = usePodcastDetail();

  if (isPending) {
    return <EpisodeListSkeleton />;
  }

  if (isError) {
    return (
      <p className="rounded-lg bg-red-50 p-4 text-red-700" role="alert">
        We could not load this podcast&apos;s episodes.
      </p>
    );
  }

  return (
    <section>
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h1 className="text-2xl font-bold">Episodes: {episodes.length}</h1>
      </div>
      <EpisodeTable episodes={episodes} />
    </section>
  );
}
