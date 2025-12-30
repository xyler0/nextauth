import { ToneRules } from '../interfaces/tone-rules.interface';

export const DEFAULT_TONE_RULES: ToneRules = {
  minSentenceLength: 5,
  maxSentenceLength: 20,
  maxSentences: 3,
  bannedPhrases: [
    'just wanted to',
    'excited to announce',
    'thrilled to',
    'I think',
    'in my opinion',
    'arguably',
    'basically',
    'actually',
    'honestly',
    'literally',
  ],
  requiredDensity: 0.7,
  compressionRatio: 0.3,
};