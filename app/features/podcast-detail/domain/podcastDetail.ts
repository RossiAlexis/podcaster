import type { Episode } from "./episode";

export interface PodcastDetail {
  id: string;
  title: string;
  author: string;
  artworkUrl: string;
  genre: string;
  description?: string;
  episodes: Episode[];
}
