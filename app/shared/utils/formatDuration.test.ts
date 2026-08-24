import { describe, expect, test } from "vitest";

import { formatDuration } from "@/shared/utils/formatDuration";

describe("formatDuration", () => {
  test.each([
    { duration: undefined, expected: "-" },
    { duration: 0, expected: "-" },
    { duration: 65_000, expected: "1:05" },
    { duration: 3_661_000, expected: "1:01:01" },
  ])(
    "formats $duration milliseconds as $expected",
    ({ duration, expected }) => {
      expect(formatDuration(duration)).toBe(expected);
    },
  );
});
