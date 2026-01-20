import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { TwitterApi } from 'twitter-api-v2';

@Injectable()
export class XService {
  private readonly logger = new Logger(XService.name);
  private readonly dryRun: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.dryRun = this.config.get<boolean>('X_DRY_RUN', true);
    this.logger.log(`X Service initialized (DRY RUN: ${this.dryRun})`);
  }

  async post(text: string, userId: string): Promise<{ id?: string; text: string }> {
    if (this.dryRun) {
      this.logger.warn(`[DRY RUN] Would post to X for user ${userId}:`);
      this.logger.warn(text);
      return { text };
    }
    throw new BadRequestException(
      'X posting requires Auth.js integration. ' +
      'Please implement provider token access from Auth.js accounts table.'
    );
  }

  private async postWithOAuth(
    text: string,
    accessToken: string,
    accessSecret: string,
  ): Promise<{ id: string; text: string }> {
    try {
      const consumerKey = this.config.get<string>('TWITTER_CLIENT_ID')!;
      const consumerSecret = this.config.get<string>('TWITTER_CLIENT_SECRET')!;

      const client = new TwitterApi({
        appKey: consumerKey,
        appSecret: consumerSecret,
        accessToken,
        accessSecret,
      });

      const tweet = await client.v2.tweet(text);
      this.logger.log(`Posted to X via OAuth: ${tweet.data.id}`);

      return { id: tweet.data.id, text: tweet.data.text };
    } catch (error) {
      this.logger.error('Failed to post to X via OAuth', error);
      throw error;
    }
  }

  async verifyCredentials(userId: string): Promise<boolean> {
    if (this.dryRun) return true;

    this.logger.warn(
      'verifyCredentials: X tokens now managed by Auth.js. ' +
      'This method returns false. Implement Auth.js provider token access.'
    );
    return false;
  }
}