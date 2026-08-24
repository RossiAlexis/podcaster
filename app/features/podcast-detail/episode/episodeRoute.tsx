import { AudioPlayer } from "@/features/podcast-detail/episode/components/AudioPlayer";
import { EpisodeDescription } from "@/features/podcast-detail/episode/components/EpisodeDescription";
import { useEpisode } from "@/features/podcast-detail/episode/hooks/useEpisode";

export default function EpisodeRoute() {
  const { episode, isPending, isError } = useEpisode();

  if (isPending) {
    return <p className="text-sm text-slate-500">Loading episode…</p>;
  }

  if (isError || !episode) {
    return <EpisodeError />;
  }

  return (
    <article className="h-fit rounded-lg border border-slate-200 bg-surface p-6 shadow-card">
      <h1 className="border-b border-slate-200 pb-5 text-2xl font-bold">
        {episode.title}
      </h1>
      <div className="py-5">
        <EpisodeDescription html={episode.description ?? ""} />
        <AudioPlayer src={episode.audioUrl} />
      </div>
    </article>
  );
}

function EpisodeError() {
  return (
    <p className="rounded-lg bg-red-50 p-4 text-red-700" role="alert">
      We could not load this episode.
    </p>
  );
}
