import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ThemeToggle } from "@/shared/theme/ThemeToggle";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

function mockSystemTheme(prefersDark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: prefersDark,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      removeEventListener: vi.fn(),
    })),
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
    mockSystemTheme(false);
  });

  afterEach(() => vi.unstubAllGlobals());

  test("offers light, dark, and system themes", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const light = screen.getByRole("button", { name: "Light theme" });
    const dark = screen.getByRole("button", { name: "Dark theme" });
    const system = screen.getByRole("button", { name: "System theme" });

    await user.click(dark);
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("podcaster-theme")).toBe("dark");
    expect(dark).toHaveAttribute("aria-pressed", "true");

    await user.click(light);
    expect(document.documentElement).not.toHaveClass("dark");
    expect(window.localStorage.getItem("podcaster-theme")).toBe("light");
    expect(light).toHaveAttribute("aria-pressed", "true");

    await user.click(system);
    expect(window.localStorage.getItem("podcaster-theme")).toBeNull();
    expect(system).toHaveAttribute("aria-pressed", "true");
  });

  test("restores the saved theme", async () => {
    window.localStorage.setItem("podcaster-theme", "dark");

    render(<ThemeToggle />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Dark theme" }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
    expect(document.documentElement).toHaveClass("dark");
  });
});
