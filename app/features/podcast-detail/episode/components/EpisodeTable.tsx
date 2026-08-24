import { formatDuration } from "@/shared/utils/formatDuration";
import { AppLink } from "@/shared/navigation/AppLink";
import type { Episode } from "@/features/podcast-detail/episode/domain/episode";

type EpisodeTableProps = {
  episodes: readonly Episode[];
};

export function EpisodeTable({ episodes }: EpisodeTableProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-surface shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Duration</th>
          </tr>
        </thead>
        <tbody>
          {episodes.map((episode) => (
            <tr
              key={episode.id}
              className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
            >
              <td className="px-4 py-3">
                <AppLink
                  className="text-brand-600 hover:underline"
                  to={`episode/${episode.id}`}
                >
                  {episode.title}
                </AppLink>
              </td>
              <td className="px-4 py-3">
                {new Date(episode.releaseDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">{formatDuration(episode.duration)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
