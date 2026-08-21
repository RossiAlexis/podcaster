import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import { fetchPodcastDetail } from "./fetchPodcastDetail";

const LOOKUP_URL = "https://itunes.apple.com/lookup";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe("fetchPodcastDetail", () => {
  test("keeps valid episodes and logs discarded lookup results", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    server.use(
      http.get(LOOKUP_URL, () =>
        HttpResponse.json({
          resultCount: 4,
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
              trackName: "Valid episode",
              releaseDate: "2026-08-20T12:00:00Z",
              trackTimeMillis: 90_000,
              episodeUrl: "https://example.com/episode.mp3",
              description: "Episode description",
            },
            {
              kind: "podcast-episode",
              trackId: 789,
              trackName: 42,
              releaseDate: "2026-08-21T12:00:00Z",
              episodeUrl: "https://example.com/invalid.mp3",
            },
            {
              kind: "audiobook",
              trackId: 999,
            },
          ],
        }),
      ),
    );

    await expect(fetchPodcastDetail("123")).resolves.toEqual({
      id: "123",
      title: "Podcast title",
      author: "Podcast author",
      artworkUrl: "https://example.com/podcast.jpg",
      genre: "Technology",
      episodes: [
        {
          id: 456,
          title: "Valid episode",
          releaseDate: "2026-08-20T12:00:00Z",
          duration: 90_000,
          audioUrl: "https://example.com/episode.mp3",
          description: "Episode description",
        },
      ],
    });
    expect(consoleError).toHaveBeenCalledTimes(2);
  });

  test("logs and rejects an unusable response", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    server.use(
      http.get(LOOKUP_URL, () =>
        HttpResponse.json({
          resultCount: 1,
          results: "not-an-array",
        }),
      ),
    );

    await expect(fetchPodcastDetail("123")).rejects.toThrow();
    expect(consoleError).toHaveBeenCalledWith(
      "Invalid podcast detail response",
      expect.any(Array),
    );
  });
});
