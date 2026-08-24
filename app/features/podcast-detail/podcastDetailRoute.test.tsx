import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { createRoutesStub, Outlet, useLocation } from "react-router";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

import type { PodcastSummary } from "@/features/podcast-catalog/domain/podcastSummary";
import PodcastLayout from "@/features/podcast-detail/layout";
import PodcastDetailRoute from "@/features/podcast-detail/podcastDetailRoute";
import { NavigationProvider } from "@/shared/navigation/NavigationContext";

const LOOKUP_URL = "https://itunes.apple.com/lookup";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function TestRoot() {
  return (
    <NavigationProvider>
      <Outlet />
    </NavigationProvider>
  );
}

function LocationProbe() {
  return <div>{useLocation().pathname}</div>;
}

function renderPodcastDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const catalogPodcast: PodcastSummary = {
    id: "123",
    title: "Catalog title",
    author: "Catalog author",
    artworkUrl: "https://example.com/catalog.jpg",
    description: "Catalog description",
    genre: "Technology",
  };
  queryClient.setQueryData(["podcast-catalog"], [catalogPodcast]);

  const RoutesStub = createRoutesStub([
    {
      Component: TestRoot,
      children: [
        {
          path: "/podcast/:podcastId",
          Component: PodcastLayout,
          children: [
            { index: true, Component: PodcastDetailRoute },
            { path: "episode/:episodeId", Component: LocationProbe },
          ],
        },
      ],
    },
  ]);

  return render(
    <QueryClientProvider client={queryClient}>
      <RoutesStub initialEntries={["/podcast/123"]} />
    </QueryClientProvider>,
  );
}

describe("podcast detail route", () => {
  test("shows podcast details and its valid episodes", async () => {
    server.use(
      http.get(LOOKUP_URL, () =>
        HttpResponse.json({
          results: [
            {
              kind: "podcast",
              collectionId: 123,
              artistName: "Podcast author",
              trackName: "Podcast title",
              artworkUrl600: "https://example.com/podcast.jpg",
              primaryGenreName: "Technology",
              feedUrl: "https://example.com/feed.xml",
            },
            {
              kind: "podcast-episode",
              trackId: 456,
              episodeGuid: "episode-guid",
              trackName: "Episode title",
              releaseDate: "2026-08-20T12:00:00Z",
              trackTimeMillis: 90_000,
              episodeUrl: "https://example.com/episode.mp3",
            },
          ],
        }),
      ),
    );
    renderPodcastDetail();

    expect(
      await screen.findByRole("heading", { name: "Podcast title" }),
    ).toBeVisible();
    expect(screen.getByText("by Podcast author")).toBeVisible();
    expect(screen.getByText("Catalog description")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Episodes: 1" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "Episode title" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "1:30" })).toBeVisible();
  });

  test("navigates to an episode within the current podcast", async () => {
    server.use(
      http.get(LOOKUP_URL, () =>
        HttpResponse.json({
          results: [
            {
              kind: "podcast",
              collectionId: 123,
              artistName: "Podcast author",
              trackName: "Podcast title",
              artworkUrl600: "https://example.com/podcast.jpg",
              primaryGenreName: "Technology",
              feedUrl: "https://example.com/feed.xml",
            },
            {
              kind: "podcast-episode",
              trackId: 456,
              episodeGuid: "episode-guid",
              trackName: "Episode title",
              releaseDate: "2026-08-20T12:00:00Z",
              trackTimeMillis: 90_000,
              episodeUrl: "https://example.com/episode.mp3",
            },
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderPodcastDetail();

    await user.click(
      await screen.findByRole("link", { name: "Episode title" }),
    );

    expect(screen.getByText("/podcast/123/episode/456")).toBeVisible();
  });

  test("shows a friendly message when the podcast cannot be loaded", async () => {
    server.use(
      http.get(LOOKUP_URL, () => new HttpResponse(null, { status: 503 })),
    );

    renderPodcastDetail();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not load this podcast.",
    );
  });
});
