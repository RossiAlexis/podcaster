import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { NavigationContext } from "./NavigationContext";
import { NavigationIndicator } from "./NavigationIndicator";

describe("Navigation Indicator test", () => {
  test("Pending navigation should be shown when navigation is pending", () => {
    const { rerender } = render(
      <NavigationContext.Provider
        value={{ isPending: false, navigate: vi.fn() }}
      >
        <NavigationIndicator />
      </NavigationContext.Provider>,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    rerender(
      <NavigationContext.Provider
        value={{ isPending: true, navigate: vi.fn() }}
      >
        <NavigationIndicator />
      </NavigationContext.Provider>,
    );
    expect(screen.queryByRole("status")).toBeInTheDocument();

    rerender(
      <NavigationContext.Provider
        value={{ isPending: false, navigate: vi.fn() }}
      >
        <NavigationIndicator />
      </NavigationContext.Provider>,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
