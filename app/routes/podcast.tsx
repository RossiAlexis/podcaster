import { AppLink } from "@/shared/navigation/AppLink";
import { useParams } from "react-router";

export default function PodscastDetail() {
  const params = useParams();
  return (
    <>
      <h1>Podcast with id {params.podcastId}</h1>
      <AppLink to={`podcast/${params.podcastId}/episode/123`}>
        Go to episode 123
      </AppLink>
    </>
  );
}
