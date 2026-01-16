import { Injectable } from '@nestjs/common';
import { TextAnalysis, SentenceAnalysis } from './interfaces/pattern-analysis.interface';

@Injectable()
export class PatternAnalyzerService {
  analyzeSentence(sentence: string): SentenceAnalysis {
    const trimmed = sentence.trim();
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    
    return {
      length: words.length,
      words,
      startsWithCapital: /^[A-Z]/.test(trimmed),
      endsWithPunctuation: trimmed.slice(-1),
      hasComma: trimmed.includes(','),
      hasDash: trimmed.includes('—') || trimmed.includes('-'),
      hasEllipsis: trimmed.includes('...'),
    };
  }

  analyzeText(text: string): TextAnalysis {
    // Split into sentences
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => this.analyzeSentence(s));

    // Word frequency analysis
    const allWords: string[] = [];
    const wordFrequency: Record<string, number> = {};
    const commonStarters: Record<string, number> = {};

    sentences.forEach(sentence => {
      // Track all words
      sentence.words.forEach(word => {
        const lower = word.toLowerCase();
        allWords.push(lower);
        wordFrequency[lower] = (wordFrequency[lower] || 0) + 1;
      });

      // Track sentence starters
      if (sentence.words.length > 0) {
        const starter = sentence.words[0];
        commonStarters[starter] = (commonStarters[starter] || 0) + 1;
      }
    });

    // Calculate averages
    const avgSentenceLength = sentences.length > 0
      ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
      : 0;

    // Punctuation stats
    const punctuationStats = {
      commas: (text.match(/,/g) || []).length,
      periods: (text.match(/\./g) || []).length,
      dashes: (text.match(/[—-]/g) || []).length,
      ellipsis: (text.match(/\.\.\./g) || []).length,
    };

    return {
      sentences,
      avgSentenceLength,
      totalWords: allWords.length,
      uniqueWords: new Set(allWords),
      wordFrequency,
      commonStarters,
      punctuationStats,
      hasEmojis: /[\u{1F600}-\u{1F64F}]/u.test(text),
      hasHashtags: /#\w+/.test(text),
      hasAbbreviations: /\b[A-Z]{2,}\b/.test(text),
    };
  }

  calculateFormalityScore(analysis: TextAnalysis): number {
    let score = 5.0; // Start neutral

    // Formal indicators (+)
    if (analysis.avgSentenceLength > 15) score += 1;
    if (analysis.punctuationStats.commas > analysis.sentences.length) score += 0.5;
    
    // Informal indicators (-)
    if (analysis.hasEmojis) score -= 2;
    if (analysis.hasAbbreviations) score -= 1;
    if (analysis.avgSentenceLength < 10) score -= 1;

    return Math.max(1, Math.min(10, score));
  }

  extractTopWords(wordFrequency: Record<string, number>, limit = 20): string[] {
    // Filter out common stop words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    
    return Object.entries(wordFrequency)
      .filter(([word]) => !stopWords.has(word) && word.length > 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word);
  }

  extractCommonStarters(starters: Record<string, number>, limit = 10): string[] {
    return Object.entries(starters)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([starter]) => starter);
  }
}