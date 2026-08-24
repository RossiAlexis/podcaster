import {
  index,
  layout,
  prefix,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  index("features/podcast-catalog/podcastSummaryRoute.tsx"),

  ...prefix("podcast/:podcastId", [
    layout("features/podcast-detail/layout.tsx", [
      index("features/podcast-detail/podcastDetailRoute.tsx"),
      route("episode/:episodeId", "features/podcast-detail/episode/episodeRoute.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
