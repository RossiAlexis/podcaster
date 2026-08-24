import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { createRoutesStub, Outlet } from "react-router";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

import EpisodeRoute from "@/features/podcast-detail/episode/episodeRoute";
import PodcastLayout from "@/features/podcast-detail/layout";
import { NavigationProvider } from "@/shared/navigation/NavigationContext";

const LOOKUP_URL = "https://itunes.apple.com/lookup";
const FEED_URL = "https://example.com/feed.xml";
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

function renderEpisode() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const RoutesStub = createRoutesStub([
    {
      Component: TestRoot,
      children: [
        {
          path: "/podcast/:podcastId",
          Component: PodcastLayout,
          children: [
            {
              path: "episode/:episodeId",
              Component: EpisodeRoute,
            },
          ],
        },
      ],
    },
  ]);

  const view = render(
    <QueryClientProvider client={queryClient}>
      <RoutesStub initialEntries={["/podcast/123/episode/456"]} />
    </QueryClientProvider>,
  );

  return { ...view, queryClient };
}

describe("episode route", () => {
  test("shows the selected episode using its feed description", async () => {
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
      http.get(FEED_URL, () =>
        HttpResponse.xml(`
          <rss>
            <channel>
              <item>
                <guid>episode-guid</guid>
                <title>Episode title</title>
                <description><![CDATA[
                  <p>Feed <strong>description</strong></p>
                ]]></description>
                <enclosure url="https://example.com/episode.mp3" />
              </item>
            </channel>
          </rss>
        `),
      ),
    );

    const { queryClient } = renderEpisode();

    expect(
      await screen.findByRole("heading", { name: "Episode title", level: 1 }),
    ).toBeVisible();
    expect(screen.getByText("description").tagName).toBe("STRONG");
    expect(document.querySelector("audio")).toHaveAttribute(
      "src",
      "https://example.com/episode.mp3",
    );
    expect(
      screen.getByRole("heading", { name: "Podcast title" }),
    ).toBeVisible();
    expect(
      queryClient.getQueryData(["podcast-episode", "123", 456]),
    ).toMatchObject({
      id: 456,
      description: expect.stringContaining("<strong>description</strong>"),
    });
  });

  test("shows a friendly message when the episode does not exist", async () => {
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
              trackId: 999,
              episodeGuid: "another-episode-guid",
              trackName: "Another episode",
              releaseDate: "2026-08-20T12:00:00Z",
              episodeUrl: "https://example.com/another.mp3",
            },
          ],
        }),
      ),
    );

    renderEpisode();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not load this episode.",
    );
  });

  test("renders audio with lookup data when feed enrichment fails", async () => {
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
      http.get("https://api.allorigins.win/raw", () => HttpResponse.error()),
    );

    renderEpisode();

    expect(
      await screen.findByRole("heading", { name: "Episode title", level: 1 }),
    ).toBeVisible();
    expect(screen.getByText("Lookup description")).toBeVisible();
    expect(document.querySelector("audio")).toHaveAttribute(
      "src",
      "https://example.com/episode.mp3",
    );
  });
});
