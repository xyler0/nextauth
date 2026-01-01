import { Injectable } from '@nestjs/common';
import { ScoredSegment } from './interfaces/scored-segment.interface';

@Injectable()
export class JournalScorer {
  score(text: string): ScoredSegment {
    const conviction = this.scoreConviction(text);
    const novelty = this.scoreNovelty(text);
    const signal = this.scoreSignal(text);

    return {
      text,
      convictionScore: conviction,
      noveltyScore: novelty,
      signalScore: signal,
      totalScore: conviction + novelty + signal,
    };
  }

  private scoreConviction(text: string): number {
    let score = 0;

    // Declarative statements (ends with period, starts with capital)
    if (/^[A-Z][^?]*\.$/.test(text.trim())) {
      score += 2;
    }

    // Absolute terms indicate conviction
    if (/\b(is|are|will|must|never|always|only)\b/.test(text)) {
      score += 1;
    }

    // Strong action verbs
    if (/\b(built|shipped|created|deployed|implemented|solved)\b/i.test(text)) {
      score += 2;
    }

    // Hedging reduces conviction
    if (/\b(maybe|perhaps|might|could|possibly|probably)\b/i.test(text)) {
      score -= 2;
    }

    return Math.max(0, score);
  }

  private scoreNovelty(text: string): number {
    let score = 0;

    // Specific numbers or data points
    if (/\d+/.test(text)) {
      score += 1;
    }

    // Technical or concrete nouns
    const concretePattern = /\b(code|system|architecture|algorithm|feature|bug|performance|API|database)\b/i;
    if (concretePattern.test(text)) {
      score += 2;
    }

    // Time-based statements indicate recency
    if (/\b(today|yesterday|this week|recently|now|currently)\b/i.test(text)) {
      score += 1;
    }

    // Generic fluff reduces novelty
    if (/\b(things|stuff|really|very|just|quite|pretty)\b/i.test(text)) {
      score -= 1;
    }

    return Math.max(0, score);
  }

  private scoreSignal(text: string): number {
    const words = text.split(/\s+/).length;

    // Signal density: fewer words with more meaning = higher score
    let score = words < 15 ? 3 : words < 25 ? 2 : 1;

    // Outcome-oriented language
    if (/\b(result|outcome|learned|discovered|realized|found)\b/i.test(text)) {
      score += 2;
    }

    // Problem-solution framing
    if (/\b(problem|solution|challenge|fix|resolve)\b/i.test(text)) {
      score += 1;
    }

    // Vague language reduces signal
    if (/\b(somehow|something|somewhat|kind of|sort of)\b/i.test(text)) {
      score -= 2;
    }

    return Math.max(0, score);
  }
}