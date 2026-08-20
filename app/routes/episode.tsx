import { useParams } from "react-router";

export default function Episode() {
  const params = useParams();
  return (
    <h1>
      Episode {params.episodeId} for podcast {params.podcastId}
    </h1>
  );
}
