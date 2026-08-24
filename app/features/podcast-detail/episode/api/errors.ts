export class FeedEnrichmentError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "FeedEnrichmentError";
  }
}
