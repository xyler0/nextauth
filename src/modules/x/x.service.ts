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

    // Get user's X credentials 
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        xAccessToken: true,
        xAccessSecret: true,
        xApiKey: true,
        xApiSecret: true,
      },
    });

    // Use OAuth tokens if available
    if (user?.xAccessToken && user?.xAccessSecret) {
      return this.postWithOAuth(text, user.xAccessToken, user.xAccessSecret);
    }

    // Fallback to manual credentials
    if (user?.xApiKey && user?.xApiSecret) {
      this.logger.warn('Using manual X credentials. Please link via OAuth.');
      return this.postWithManualCredentials(text, user);
    }

    throw new BadRequestException('X account not linked. Please connect via OAuth.');
  } 

  private async postWithOAuth(
    text: string,
    accessToken: string,
    accessSecret: string,
  ): Promise<{ id: string; text: string }> {
    try {
      const consumerKey = this.config.get<string>('TWITTER_CONSUMER_KEY');
      const consumerSecret = this.config.get<string>('TWITTER_CONSUMER_SECRET');

      const client = new TwitterApi({
        appKey: consumerKey!,
        appSecret: consumerSecret!,
        accessToken,
        accessSecret,
      });

      const tweet = await client.v2.tweet(text);
      this.logger.log(`Posted to X via OAuth: ${tweet.data.id}`);

      return {
        id: tweet.data.id,
        text: tweet.data.text,
      };
    } catch (error) {
      this.logger.error('Failed to post to X via OAuth', error);
      throw error;
    }
  }

  private async postWithManualCredentials(text: string, user: any) {
    try {
      const client = new TwitterApi({
        appKey: user.xApiKey,
        appSecret: user.xApiSecret,
        accessToken: user.xAccessToken,
        accessSecret: user.xAccessSecret,
      });

      const tweet = await client.v2.tweet(text);
      this.logger.log(`Posted to X: ${tweet.data.id}`);

      return {
        id: tweet.data.id,
        text: tweet.data.text,
      };
    } catch (error) {
      this.logger.error('Failed to post to X', error);
      throw error;
    }
  }

  async verifyCredentials(userId: string): Promise<boolean> {
    if (this.dryRun) {
      return true;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        xAccessToken: true,
        xAccessSecret: true,
      },
    });

    if (!user?.xAccessToken) {
      return false;
    }

    try {
      const consumerKey = this.config.get<string>('TWITTER_CONSUMER_KEY');
      const consumerSecret = this.config.get<string>('TWITTER_CONSUMER_SECRET');

      const client = new TwitterApi({
        appKey: consumerKey!,
        appSecret: consumerSecret!,
        accessToken: user.xAccessToken!,
        accessSecret: user.xAccessSecret!,
      });

      await client.v2.me();
      return true;
    } catch (error) {
      this.logger.error('X credentials verification failed', error);
      return false;
    }
  }
}