export interface SentenceAnalysis {
  length: number;
  words: string[];
  startsWithCapital: boolean;
  endsWithPunctuation: string;
  hasComma: boolean;
  hasDash: boolean;
  hasEllipsis: boolean;
}

export interface TextAnalysis {
  sentences: SentenceAnalysis[];
  avgSentenceLength: number;
  totalWords: number;
  uniqueWords: Set<string>;
  wordFrequency: Record<string, number>;
  commonStarters: Record<string, number>;
  punctuationStats: {
    commas: number;
    periods: number;
    dashes: number;
    ellipsis: number;
  };
  hasEmojis: boolean;
  hasHashtags: boolean;
  hasAbbreviations: boolean;
}