export interface ToneRules {
  minSentenceLength: number;
  maxSentenceLength: number;
  maxSentences: number;
  bannedPhrases: string[];
  requiredDensity: number;
  compressionRatio: number;
}