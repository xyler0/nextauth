import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ToneService } from '../tone/tone.service';
import { XService } from '../x/x.service';
import { StoreService } from '../store/store.service';
import { PostSource } from '../../generated/prisma/client';

export interface PostMetadata {
  tags?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

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
    userId: string,
    userMaxPosts: number,
    metadata?: PostMetadata,
  ): Promise<{ posted: boolean; reason?: string; postId?: string }> {
    this.logger.log(`Composing post from ${source} for user ${userId}`);

    // Check daily limit
    const canPost = await this.store.canPostToday(userId, userMaxPosts);
    if (!canPost) {
      this.logger.warn(`Daily post limit reached for user ${userId}`);
      return { posted: false, reason: 'Daily limit reached' };
    }

    // Check for duplicates
    const isDuplicate = await this.store.isDuplicate(rawText, userId);
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
        userId,
        source,
        metadata,
      });

      // Post to X
      await this.x.post(polished, userId);

      // Mark as posted
      await this.store.markAsPosted(id);
      await this.store.incrementDailyStats(new Date());

      this.logger.log(`Post published successfully: ${id}`);
      return { posted: true, postId: id };
    } catch (error: unknown) {
    let reason = 'Unknown error';
    if (error instanceof Error) {
    reason = error.message;
     }
      this.logger.error('Composition failed', reason);
      return { posted: false, reason };
    }
  }

  async composeMany(
    texts: string[],
    source: PostSource,
    userId: string,
    userMaxPosts: number,
    metadata?: PostMetadata,
  ): Promise<Array<{ text: string; posted: boolean; reason?: string; postId?: string }>> {
    const results: Array<{ text: string; posted: boolean; reason?: string; postId?: string }> = [];

    for (const text of texts) {
      const result = await this.compose(text, source, userId, userMaxPosts, metadata);
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
