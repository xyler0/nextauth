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
        xApiKey: true,
        xApiSecret: true,
        xAccessToken: true,
        xAccessSecret: true,
      },
    });

    if (!user?.xApiKey || !user?.xApiSecret || !user?.xAccessToken || !user?.xAccessSecret) {
      throw new BadRequestException('X credentials not configured for this user');
    }

    try {
      const client = new TwitterApi({
        appKey: user.xApiKey,
        appSecret: user.xApiSecret,
        accessToken: user.xAccessToken,
        accessSecret: user.xAccessSecret,
      });

      const tweet = await client.v2.tweet(text);
      this.logger.log(`Posted to X: ${tweet.data.id} for user ${userId}`);
      
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
        xApiKey: true,
        xApiSecret: true,
        xAccessToken: true,
        xAccessSecret: true,
      },
    });

    if (!user?.xApiKey) {
      return false;
    }

    try {
      const client = new TwitterApi({
        appKey: user.xApiKey,
        appSecret: user.xApiSecret,
        accessToken: user.xAccessToken,
        accessSecret: user.xAccessSecret,
      });

      await client.v2.me();
      return true;
    } catch (error) {
      this.logger.error('X credentials verification failed', error);
      return false;
    }
  }
}