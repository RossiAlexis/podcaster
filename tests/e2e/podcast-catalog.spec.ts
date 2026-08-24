import { expect, test } from "@playwright/test";

const CATALOG_URL =
  "https://itunes.apple.com/us/rss/toppodcasts/limit=100/genre=1310/json";

test.beforeEach(async ({ request }) => {
  const catalogResponse = await request.get(CATALOG_URL).catch(() => null);
  test.skip(
    !catalogResponse?.ok(),
    "The external iTunes catalog is unavailable",
  );
});

test("filters the podcast catalog and preserves the search in the URL", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const cards = page.locator('main a[href^="/podcast/"]');
  const resultCount = page.locator("output");
  const search = page.getByRole("searchbox", { name: "Filter podcasts" });
  await expect(search).toBeVisible();
  await expect(cards.first()).toBeVisible();
  await expect(resultCount).not.toHaveText("0");

  const searchWithNoMatches = "__podcaster_e2e_no_match__";
  await search.fill(searchWithNoMatches);

  await expect
    .poll(() => new URL(page.url()).searchParams.get("search"), {
      timeout: 15_000,
    })
    .toBe(searchWithNoMatches);
  await expect(cards).toHaveCount(0);
  await expect(resultCount).toHaveText("0");

  await page.reload();

  await expect(search).toHaveValue(searchWithNoMatches);
  await expect(cards).toHaveCount(0);
  await expect(resultCount).toHaveText("0");
});

test("opens the selected podcast and displays its episodes", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const firstPodcast = page.locator('main a[href^="/podcast/"]').first();
  await expect(firstPodcast).toBeVisible();

  const href = await firstPodcast.getAttribute("href");
  if (!href) throw new Error("The podcast card has no destination");

  await firstPodcast.click();

  await expect.poll(() => new URL(page.url()).pathname).toBe(href);
  await expect(
    page.getByRole("heading", { name: /^Episodes: \d+$/ }),
  ).toBeVisible();
  const episodeTable = page.getByRole("table");
  await expect(episodeTable).toBeVisible();
  await expect(episodeTable.getByRole("row").nth(1)).toBeVisible();
});

test("opens an episode detail and supports direct deep-link", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const firstPodcast = page.locator('main a[href^="/podcast/"]').first();
  await expect(firstPodcast).toBeVisible();

  await firstPodcast.click();

  const firstEpisodeLink = page.locator('a[href*="/episode/"]').first();
  await expect(firstEpisodeLink).toBeVisible();

  const episodeHref = await firstEpisodeLink.getAttribute("href");
  if (!episodeHref) throw new Error("The episode row has no destination");

  await firstEpisodeLink.click();

  await expect.poll(() => new URL(page.url()).pathname).toBe(episodeHref);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("audio")).toBeVisible();

  await page.goto(episodeHref);
  await expect.poll(() => new URL(page.url()).pathname).toBe(episodeHref);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
