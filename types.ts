
export interface VocabEntry {
  id: string;
  english: string;
  indonesian: string;
  isMemorized: boolean;
  note: string;
  isLoading: boolean;
  isNew?: boolean;
}

export interface AIResponse {
  translation: string;
  note: string;
}

export interface BulkImportResponse {
  words: Array<{
    english: string;
    indonesian: string;
    note: string;
  }>;
}
