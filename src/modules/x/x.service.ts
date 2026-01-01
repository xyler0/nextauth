import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwitterApi } from 'twitter-api-v2';

@Injectable()
export class XService {
  private readonly logger = new Logger(XService.name);
  private readonly client: TwitterApi;
  private readonly dryRun: boolean;

  constructor(private readonly config: ConfigService) {
    this.dryRun = this.config.get<boolean>('X_DRY_RUN', true);

    const apiKey = this.config.get<string>('X_API_KEY');
    const apiSecret = this.config.get<string>('X_API_SECRET');
    const accessToken = this.config.get<string>('X_ACCESS_TOKEN');
    const accessSecret = this.config.get<string>('X_ACCESS_SECRET');

    if (!this.dryRun && (!apiKey || !apiSecret || !accessToken || !accessSecret)) {
      throw new Error('X API credentials are required when dry run is disabled');
    }

    this.client = new TwitterApi({
      appKey: apiKey!,
      appSecret: apiSecret!,
      accessToken: accessToken!,
      accessSecret: accessSecret!,
    });

    if (!this.client) {
   throw new Error('Twitter client not initialized');
    }

    this.logger.log(`X Service initialized (DRY RUN: ${this.dryRun})`);
  }

  async post(text: string): Promise<{ id?: string; text: string }> {
    if (this.dryRun) {
      this.logger.warn('[DRY RUN] Would post to X:');
      this.logger.warn(text);
      return { text };
    }

    try {
      const tweet = await this.client.v2.tweet(text);
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

  async verifyCredentials(): Promise<boolean> {
    if (this.dryRun) {
      return true;
    }

    try {
      await this.client.v2.me();
      return true;
    } catch (error) {
      this.logger.error('X credentials verification failed', error);
      return false;
    }
  }
}