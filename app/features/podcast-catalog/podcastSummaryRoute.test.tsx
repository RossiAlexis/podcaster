import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { createRoutesStub, Outlet } from "react-router";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import { NavigationProvider } from "@/shared/navigation/NavigationContext";
import type { PodcastSummary } from "@/features/podcast-catalog/domain/podcastSummary";
import PodcastCatalog from "@/features/podcast-catalog/podcastSummaryRoute";

const CATALOG_URL =
  "https://itunes.apple.com/us/rss/toppodcasts/limit=100/genre=1310/json";
const ONE_DAY = 24 * 60 * 60 * 1000;

const podcasts: PodcastSummary[] = [
  {
    id: "syntax",
    title: "Syntax",
    author: "Wes Bos and Scott Tolinski",
    artworkUrl: "https://example.com/syntax.jpg",
    description: "A web development podcast",
    genre: "Technology",
  },
  {
    id: "daily",
    title: "The Daily",
    author: "The New York Times",
    artworkUrl: "https://example.com/daily.jpg",
    description: "Daily news",
    genre: "News",
  },
  {
    id: "history",
    title: "The Rest Is History",
    author: "Goalhanger",
    artworkUrl: "https://example.com/history.jpg",
    description: "Stories from history",
    genre: "History",
  },
];

const refreshedPodcast: PodcastSummary = {
  id: "refreshed",
  title: "Refreshed podcast",
  author: "Refreshed author",
  artworkUrl: "https://example.com/refreshed.jpg",
  description: "Refreshed description",
  genre: "Technology",
};

function catalogResponse(podcastList: PodcastSummary[]) {
  return HttpResponse.json({
    feed: {
      entry: podcastList.map((podcast) => ({
        id: { attributes: { "im:id": podcast.id } },
        "im:name": { label: podcast.title },
        "im:artist": { label: podcast.author },
        "im:image": [{ label: podcast.artworkUrl }],
        summary: { label: podcast.description },
        category: {
          attributes: { label: podcast.genre },
        },
      })),
    },
  });
}

const server = setupServer(
  http.get(CATALOG_URL, () => catalogResponse(podcasts)),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

function TestLayout() {
  return (
    <NavigationProvider>
      <Outlet />
    </NavigationProvider>
  );
}

function renderCatalog(loaderData: PodcastSummary[] = podcasts) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const RoutesStub = createRoutesStub([
    {
      Component: TestLayout,
      children: [
        {
          index: true,
          Component: PodcastCatalog,
          loader: () => loaderData,
        },
      ],
    },
  ]);

  return render(
    <QueryClientProvider client={queryClient}>
      <RoutesStub />
    </QueryClientProvider>,
  );
}

describe("PodcastCatalogTests", () => {
  test("filters the visible podcasts as the user types", async () => {
    const user = userEvent.setup();
    renderCatalog();

    expect(await screen.findByRole("link", { name: /Syntax/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /The Daily/ })).toBeVisible();
    expect(
      screen.getByRole("link", { name: /The Rest Is History/ }),
    ).toBeVisible();
    expect(screen.getByText("3", { selector: "output" })).toBeVisible();

    await user.type(screen.getByRole("searchbox"), "syntax");

    expect(screen.getByRole("link", { name: /Syntax/ })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /The Daily/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /The Rest Is History/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1", { selector: "output" })).toBeVisible();
  });

  test("refreshes the build-time catalog when the page opens", async () => {
    let requestCount = 0;
    let releaseRequest: () => void = () => {};
    const pendingRequest = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    server.use(
      http.get(CATALOG_URL, async () => {
        requestCount += 1;
        await pendingRequest;
        return catalogResponse([refreshedPodcast]);
      }),
    );

    renderCatalog([podcasts[0]!]);

    expect(
      await screen.findByRole("link", { name: /Syntax/ }),
    ).toBeVisible();
    expect(requestCount).toBe(1);

    releaseRequest();

    expect(
      await screen.findByRole("link", { name: /Refreshed podcast/ }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /Syntax/ }),
    ).not.toBeInTheDocument();
  });

  test("refreshes the catalog again after 24 hours", async () => {
    let requestCount = 0;
    server.use(
      http.get(CATALOG_URL, () => {
        requestCount += 1;
        return catalogResponse([refreshedPodcast]);
      }),
    );
    vi.useFakeTimers();

    renderCatalog();

    await vi.waitFor(() => {
      expect(requestCount).toBe(1);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ONE_DAY);
    });

    await vi.waitFor(() => {
      expect(requestCount).toBe(2);
    });
  });
});
