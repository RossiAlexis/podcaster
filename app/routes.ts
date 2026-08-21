import {
  index,
  layout,
  prefix,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  index("features/podcast-catalog/podcastSummaryRoute.tsx"),

  ...prefix("podcast/:podcastId", [
    layout("features/podcast-detail/layout.tsx", [
      index("features/podcast-detail/podcastDetailRoute.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
