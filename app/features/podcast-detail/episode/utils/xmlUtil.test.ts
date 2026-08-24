import { describe, expect, test } from "vitest";

import {
  asRecord,
  asText,
} from "@/features/podcast-detail/episode/utils/xmlUtil";

describe("asRecord", () => {
  test("returns the same value for plain objects", () => {
    const value = { key: "value", nested: { id: 1 } };

    expect(asRecord(value)).toBe(value);
  });

  test.each([
    ["null", null],
    ["array", ["value"]],
    ["string", "value"],
    ["number", 42],
    ["boolean", true],
    ["undefined", undefined],
  ])("returns undefined for %s inputs", (_label, value) => {
    expect(asRecord(value)).toBeUndefined();
  });
});

describe("asText", () => {
  test("returns text values as-is", () => {
    expect(asText("Episode title")).toBe("Episode title");
  });

  test("converts numbers to strings", () => {
    expect(asText(12345)).toBe("12345");
  });

  test("reads text from #text nodes", () => {
    expect(asText({ "#text": "Node text" })).toBe("Node text");
  });

  test("reads text from __cdata nodes", () => {
    expect(asText({ __cdata: "<p>Rich description</p>" })).toBe(
      "<p>Rich description</p>",
    );
  });

  test("prefers __cdata over #text when both are present", () => {
    expect(
      asText({
        __cdata: "CDATA value",
        "#text": "Fallback text",
      }),
    ).toBe("CDATA value");
  });

  test("supports nested XML node wrappers", () => {
    expect(
      asText({
        __cdata: {
          "#text": "Nested text",
        },
      }),
    ).toBe("Nested text");
  });

  test.each([
    ["boolean", true],
    ["array", ["value"]],
    ["null", null],
    ["undefined", undefined],
    ["object without text markers", { title: "Episode title" }],
    ["empty object", {}],
  ])("returns undefined for %s values", (_label, value) => {
    expect(asText(value)).toBeUndefined();
  });
});
