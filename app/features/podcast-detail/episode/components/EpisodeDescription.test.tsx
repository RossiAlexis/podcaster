import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { EpisodeDescription } from "@/features/podcast-detail/episode/components/EpisodeDescription";

describe("EpisodeDescription", () => {
  test("keeps safe markup and removes executable HTML", () => {
    const { container } = render(
      <EpisodeDescription
        html={`
          <p onclick="alert('xss')">A <strong>safe</strong> description</p>
          <a href="javascript:alert('xss')">Unsafe link</a>
          <a href="https://example.com/notes">Safe link</a>
          <a href="./transcript">Relative link</a>
          <script>alert('xss')</script>
        `}
      />,
    );

    expect(screen.getByText("safe").tagName).toBe("STRONG");
    expect(screen.getByText("Unsafe link")).not.toHaveAttribute("href");
    expect(screen.getByRole("link", { name: "Safe link" })).toHaveAttribute(
      "href",
      "https://example.com/notes",
    );
    expect(screen.getByRole("link", { name: "Relative link" })).toHaveAttribute(
      "href",
      "./transcript",
    );
    expect(container.querySelector("[onclick]")).not.toBeInTheDocument();
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("alert('xss')");
  });
});
