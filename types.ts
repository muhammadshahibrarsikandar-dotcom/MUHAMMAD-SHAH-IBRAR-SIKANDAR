
export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  transliteration?: string;
  contextNotes?: string;
}

export type TranslationMode = 'text' | 'voice' | 'image';
