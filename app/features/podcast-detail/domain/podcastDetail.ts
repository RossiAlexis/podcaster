import type { Episode } from "@/features/podcast-detail/episode/domain/episode";

export interface PodcastDetail {
  id: string;
  title: string;
  author: string;
  artworkUrl: string;
  genre: string;
  feedUrl: string;
  description?: string;
  episodes: Episode[];
}
