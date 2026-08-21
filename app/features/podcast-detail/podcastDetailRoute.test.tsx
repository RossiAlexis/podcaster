import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { createRoutesStub } from "react-router";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

import type { PodcastSummary } from "@/features/podcast-catalog/domain/podcastSummary";

import PodcastLayout from "./layout";
import PodcastDetailRoute from "./podcastDetailRoute";

const LOOKUP_URL = "https://itunes.apple.com/lookup";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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
      path: "/podcast/:podcastId",
      Component: PodcastLayout,
      children: [{ index: true, Component: PodcastDetailRoute }],
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
            },
            {
              kind: "podcast-episode",
              trackId: 456,
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
