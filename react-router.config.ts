import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  prerender: ["/"],
  // Cloudflare Pages cannot rewrite unknown routes to __spa-fallback.html.
  // See docs/adr/0008-cloudflare-pages-spa-fallback.md
  async buildEnd({ reactRouterConfig }) {
    const clientDir = join(reactRouterConfig.buildDirectory, "client");
    await copyFile(
      join(clientDir, "__spa-fallback.html"),
      join(clientDir, "404.html"),
    );
  },
} satisfies Config;
