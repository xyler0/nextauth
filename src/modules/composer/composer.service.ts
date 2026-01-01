import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ToneService } from '../tone/tone.service';
import { XService } from '../x/x.service';
import { StoreService } from '../store/store.service';
import { PostSource } from '../../generated/prisma/client';

@Injectable()
export class ComposerService {
  private readonly logger = new Logger(ComposerService.name);
  private readonly maxPostsPerDay: number;

  constructor(
    private readonly config: ConfigService,
    private readonly tone: ToneService,
    private readonly x: XService,
    private readonly store: StoreService,
  ) {
    this.maxPostsPerDay = this.config.get<number>('MAX_POSTS_PER_DAY', 3);
  }

  async compose(
    rawText: string,
    source: PostSource,
    metadata?: any,
  ): Promise<{ posted: boolean; reason?: string }> {
    this.logger.log(`Composing post from ${source}`);

    // Check daily limit
    const canPost = await this.store.canPostToday(this.maxPostsPerDay);
    if (!canPost) {
      this.logger.warn('Daily post limit reached');
      return { posted: false, reason: 'Daily limit reached' };
    }

    // Check for duplicates
    const isDuplicate = await this.store.isDuplicate(rawText);
    if (isDuplicate) {
      this.logger.warn('Duplicate content detected');
      return { posted: false, reason: 'Duplicate content' };
    }

    try {
      // Apply tone transformation
      const polished = await this.tone.applyTone(rawText);
      this.logger.debug(`Tone applied: ${polished}`);

      // Create post record
      const { id } = await this.store.createPost({
        content: polished,
        source,
        metadata,
      });

      // Post to X
      await this.x.post(polished);

      // Mark as posted
      await this.store.markAsPosted(id);
      await this.store.incrementDailyStats(new Date());

      this.logger.log(`Post published successfully: ${id}`);
      return { posted: true };
    } catch (error) {
      this.logger.error('Composition failed', error);
      return { posted: false, reason: error.message };
    }
  }

  async composeMany(
    texts: string[],
    source: PostSource,
    metadata?: any,
  ): Promise<Array<{ text: string; posted: boolean; reason?: string }>> {
    const results: Array<{ text: string; posted: boolean; reason?: string }> = [];

    for (const text of texts) {
      const result = await this.compose(text, source, metadata);
      results.push({ text, ...result });

      // Add delay between posts to avoid rate limiting
      if (result.posted) {
        await this.sleep(5000); // 5 seconds
      }
    }

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}