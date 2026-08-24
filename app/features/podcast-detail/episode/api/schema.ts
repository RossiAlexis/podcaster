import { z } from "zod";

import {
  asRecord,
  asText,
} from "@/features/podcast-detail/episode/utils/xmlUtil";

const optionalXmlTextSchema = z.preprocess(asText, z.string().optional());

const optionalEnclosureUrlSchema = z.preprocess(
  (value) => asText(asRecord(value)?.["@_url"]),
  z.string().optional(),
);

export function normalizeTitle(value: string | undefined): string | undefined {
  return value?.replace(/\s+/g, " ").trim().toLowerCase();
}

const feedItemSchema = z
  .looseObject({
    guid: optionalXmlTextSchema,
    title: optionalXmlTextSchema,
    description: optionalXmlTextSchema,
    enclosure: optionalEnclosureUrlSchema,
    "content:encoded": optionalXmlTextSchema,
  })
  .transform(
    ({
      guid,
      title,
      description,
      enclosure: audioUrl,
      "content:encoded": encodedDescription,
    }) => ({
      guid,
      normalizedTitle: normalizeTitle(title),
      description: [encodedDescription, description].find((value) =>
        value?.trim(),
      ),
      audioUrl,
    }),
  );

export type FeedItem = z.output<typeof feedItemSchema>;

export const feedItemsSchema = z
  .looseObject({
    rss: z.looseObject({
      channel: z.looseObject({
        item: z.union([feedItemSchema, z.array(feedItemSchema)]).optional(),
      }),
    }),
  })
  .transform((value) => {
    const item = value.rss.channel.item;
    if (Array.isArray(item)) {
      return item;
    }

    return item ? [item] : [];
  });
