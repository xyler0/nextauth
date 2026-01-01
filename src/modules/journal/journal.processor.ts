import { Injectable, Logger } from '@nestjs/common';
import { JournalScorer } from './journal.scorer';
import { ScoredSegment } from './interfaces/scored-segment.interface';

@Injectable()
export class JournalProcessor {
  private readonly logger = new Logger(JournalProcessor.name);

  constructor(private readonly scorer: JournalScorer) {}

  process(journalText: string): string[] {
    this.logger.debug('Processing journal entry');

    // Split into segments (paragraphs or sentences)
    const segments = this.segment(journalText);
    this.logger.debug(`Found ${segments.length} segments`);

    // Score each segment
    const scored = segments.map((text) => this.scorer.score(text));

    // Log top scorers for debugging
    const topScored = [...scored]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);
    
    topScored.forEach((s, i) => {
      this.logger.debug(
        `Top ${i + 1}: Score=${s.totalScore} (C:${s.convictionScore} N:${s.noveltyScore} S:${s.signalScore}) - ${s.text.substring(0, 50)}...`
      );
    });

    // Select top 2 segments
    const top2 = scored
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 2)
      .map((s) => s.text);

    this.logger.log(`Extracted ${top2.length} high-signal segments`);
    return top2;
  }

  private segment(text: string): string[] {
    // Split by double newline (paragraphs) or single sentences
    let segments = text.split(/\n\n+/).map((s) => s.trim());

    // If paragraphs are too long, split into sentences
    segments = segments.flatMap((para) => {
      if (para.split(/\s+/).length > 40) {
        return para
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
      return [para];
    });

    // Filter out very short segments
    return segments.filter((s) => {
      const words = s.split(/\s+/).length;
      return words >= 8 && words <= 50;
    });
  }
}