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

import { fetchEpisodeFromFeed } from "@/features/podcast-detail/episode/api/fetchEpisodeFromFeed";
import type { Episode } from "@/features/podcast-detail/episode/domain/episode";

const FEED_URL = "https://example.com/feed.xml";
const ALL_ORIGINS_URL = "https://api.allorigins.win/raw";
const episode: Episode = {
  id: 456,
  guid: "episode-guid",
  title: "Episode title",
  releaseDate: "2026-08-20T12:00:00Z",
  audioUrl: "https://example.com/episode.mp3",
};
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe("fetchEpisodeFromFeed", () => {
  test("gets the episode HTML description from its RSS item", async () => {
    server.use(
      http.get(FEED_URL, () =>
        HttpResponse.xml(`
          <rss>
            <channel>
              <item>
                <guid>another-guid</guid>
                <title>Another episode</title>
                <description>Wrong description</description>
                <enclosure url="https://example.com/other.mp3" />
              </item>
              <item>
                <guid>episode-guid</guid>
                <title>Episode title</title>
                <content:encoded><![CDATA[<p>Feed <strong>description</strong></p>]]></content:encoded>
                <enclosure url="https://example.com/episode.mp3" />
              </item>
            </channel>
          </rss>
        `),
      ),
    );

    await expect(fetchEpisodeFromFeed(FEED_URL, episode)).resolves.toEqual({
      ...episode,
      description: "<p>Feed <strong>description</strong></p>",
    });
  });

  test("retries through AllOrigins when the feed cannot be fetched directly", async () => {
    server.use(
      http.get(FEED_URL, () => HttpResponse.error()),
      http.get(ALL_ORIGINS_URL, ({ request }) => {
        expect(new URL(request.url).searchParams.get("url")).toBe(FEED_URL);

        return HttpResponse.xml(`
          <rss>
            <channel>
              <item>
                <guid>episode-guid</guid>
                <title>Episode title</title>
                <description><![CDATA[<p>Proxied description</p>]]></description>
                <enclosure url="https://example.com/episode.mp3" />
              </item>
            </channel>
          </rss>
        `);
      }),
    );

    await expect(fetchEpisodeFromFeed(FEED_URL, episode)).resolves.toEqual({
      ...episode,
      description: "<p>Proxied description</p>",
    });
  });

  test("keeps lookup data when the episode is absent from the feed", async () => {
    server.use(
      http.get(FEED_URL, () =>
        HttpResponse.xml(`
          <rss>
            <channel>
              <item>
                <guid>another-guid</guid>
                <title>Another episode</title>
              </item>
            </channel>
          </rss>
        `),
      ),
    );

    await expect(fetchEpisodeFromFeed(FEED_URL, episode)).resolves.toEqual(
      episode,
    );
  });

  test("matches by GUID when enclosure URLs and titles differ", async () => {
    server.use(
      http.get(FEED_URL, () =>
        HttpResponse.xml(`
          <rss>
            <channel>
              <item>
                <guid>episode-guid</guid>
                <title>Different title</title>
                <description>Matched by GUID</description>
                <enclosure url="https://cdn.example.com/episode.mp3" />
              </item>
            </channel>
          </rss>
        `),
      ),
    );

    await expect(fetchEpisodeFromFeed(FEED_URL, episode)).resolves.toEqual({
      ...episode,
      description: "Matched by GUID",
    });
  });

  test("falls back to the enclosure URL when a feed GUID has changed", async () => {
    server.use(
      http.get(FEED_URL, () =>
        HttpResponse.xml(`
          <rss>
            <channel>
              <item>
                <guid>changed-feed-guid</guid>
                <title>Different title</title>
                <description>Matched by enclosure URL</description>
                <enclosure url="https://example.com/episode.mp3" />
              </item>
            </channel>
          </rss>
        `),
      ),
    );

    await expect(fetchEpisodeFromFeed(FEED_URL, episode)).resolves.toEqual({
      ...episode,
      description: "Matched by enclosure URL",
    });
  });

  test("falls back to a normalized title when identifiers differ", async () => {
    server.use(
      http.get(FEED_URL, () =>
        HttpResponse.xml(`
          <rss>
            <channel>
              <item>
                <guid>changed-feed-guid</guid>
                <title>  EPISODE   TITLE  </title>
                <description>Matched by title</description>
                <enclosure url="https://cdn.example.com/episode.mp3" />
              </item>
            </channel>
          </rss>
        `),
      ),
    );

    await expect(fetchEpisodeFromFeed(FEED_URL, episode)).resolves.toEqual({
      ...episode,
      description: "Matched by title",
    });
  });

  test("keeps the lookup description when the feed description is blank", async () => {
    const episodeWithDescription = {
      ...episode,
      description: "Lookup description",
    };
    server.use(
      http.get(FEED_URL, () =>
        HttpResponse.xml(`
          <rss>
            <channel>
              <item>
                <guid>episode-guid</guid>
                <title>Episode title</title>
                <description></description>
                <content:encoded></content:encoded>
                <enclosure url="https://example.com/episode.mp3" />
              </item>
            </channel>
          </rss>
        `),
      ),
    );

    await expect(
      fetchEpisodeFromFeed(FEED_URL, episodeWithDescription),
    ).resolves.toEqual(episodeWithDescription);
  });

  test("keeps lookup data when both feed requests fail", async () => {
    server.use(
      http.get(FEED_URL, () => HttpResponse.error()),
      http.get(ALL_ORIGINS_URL, () => HttpResponse.error()),
    );

    await expect(fetchEpisodeFromFeed(FEED_URL, episode)).resolves.toEqual(
      episode,
    );
  });

  test("keeps lookup data and logs when feed structure is invalid", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    server.use(
      http.get(FEED_URL, () =>
        HttpResponse.xml(`
          <not-rss>
            <item>
              <title>Episode title</title>
            </item>
          </not-rss>
        `),
      ),
    );

    await expect(fetchEpisodeFromFeed(FEED_URL, episode)).resolves.toEqual(
      episode,
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Episode enrichment from RSS failed; using lookup data.",
      expect.objectContaining({
        episodeId: 456,
        feedUrl: FEED_URL,
      }),
    );
  });
});
