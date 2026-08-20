import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/dashboard.tsx"),
  route("podcast/:podcastId", "routes/podcast.tsx"),
  route("podcast/:podcastId/episode/:episodeId", "routes/episode.tsx"),
] satisfies RouteConfig;
