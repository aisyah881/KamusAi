
export interface VocabEntry {
  id: string;
  english: string;
  indonesian: string;
  isMemorized: boolean;
  note: string;
  isLoading: boolean;
}

export interface AIResponse {
  translation: string;
  note: string;
}
