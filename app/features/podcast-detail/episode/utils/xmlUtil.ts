export type XmlRecord = Record<string, unknown>;

export function asRecord(value: unknown): XmlRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as XmlRecord)
    : undefined;
}

export function asText(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  const record = asRecord(value);
  if (!record) {
    return undefined;
  }

  return asText(record.__cdata) ?? asText(record["#text"]);
}
