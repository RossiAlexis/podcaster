export interface Episode {
  id: number;
  guid: string;
  title: string;
  releaseDate: string;
  duration?: number;
  description?: string;
  audioUrl: string;
}
