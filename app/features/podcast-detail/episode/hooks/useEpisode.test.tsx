import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { createRoutesStub } from "react-router";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

import { useEpisode } from "@/features/podcast-detail/episode/hooks/useEpisode";

const LOOKUP_URL = "https://itunes.apple.com/lookup";
const FEED_URL = "https://example.com/feed.xml";
const ALL_ORIGINS_URL = "https://api.allorigins.win/raw";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function EpisodeProbe() {
  const { episode, isPending, isError } = useEpisode();

  return (
    <div>
      <p data-testid="is-pending">{String(isPending)}</p>
      <p data-testid="is-error">{String(isError)}</p>
      <p data-testid="episode-id">{episode?.id ?? "none"}</p>
      <p data-testid="episode-description">{episode?.description ?? "none"}</p>
    </div>
  );
}

function renderProbe(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const RoutesStub = createRoutesStub([
    {
      path: "/podcast/:podcastId/episode/:episodeId",
      Component: EpisodeProbe,
    },
  ]);

  return render(
    <QueryClientProvider client={queryClient}>
      <RoutesStub initialEntries={[initialEntry]} />
    </QueryClientProvider>,
  );
}

describe("useEpisode", () => {
  test("reports an error when episode id is invalid", async () => {
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
              feedUrl: FEED_URL,
            },
            {
              kind: "podcast-episode",
              trackId: 456,
              episodeGuid: "episode-guid",
              trackName: "Episode title",
              releaseDate: "2026-08-20T12:00:00Z",
              episodeUrl: "https://example.com/episode.mp3",
            },
          ],
        }),
      ),
    );

    renderProbe("/podcast/123/episode/not-a-number");

    await waitFor(() =>
      expect(screen.getByTestId("is-pending")).toHaveTextContent("false"),
    );
    expect(screen.getByTestId("is-error")).toHaveTextContent("true");
    expect(screen.getByTestId("episode-id")).toHaveTextContent("none");
  });

  test("propagates podcast lookup failures as error state", async () => {
    server.use(
      http.get(LOOKUP_URL, () => new HttpResponse(null, { status: 503 })),
    );

    renderProbe("/podcast/123/episode/456");

    await waitFor(() =>
      expect(screen.getByTestId("is-pending")).toHaveTextContent("false"),
    );
    expect(screen.getByTestId("is-error")).toHaveTextContent("true");
  });

  test("keeps lookup episode data when feed enrichment fails", async () => {
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
              feedUrl: FEED_URL,
            },
            {
              kind: "podcast-episode",
              trackId: 456,
              episodeGuid: "episode-guid",
              trackName: "Episode title",
              releaseDate: "2026-08-20T12:00:00Z",
              episodeUrl: "https://example.com/episode.mp3",
              description: "Lookup description",
            },
          ],
        }),
      ),
      http.get(FEED_URL, () => HttpResponse.error()),
      http.get(ALL_ORIGINS_URL, () => HttpResponse.error()),
    );

    renderProbe("/podcast/123/episode/456");

    await waitFor(() =>
      expect(screen.getByTestId("is-pending")).toHaveTextContent("false"),
    );
    expect(screen.getByTestId("is-error")).toHaveTextContent("false");
    expect(screen.getByTestId("episode-id")).toHaveTextContent("456");
    expect(screen.getByTestId("episode-description")).toHaveTextContent(
      "Lookup description",
    );
  });
});
