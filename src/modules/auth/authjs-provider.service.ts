// src/modules/auth/authjs-provider.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ProviderAccount {
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
}

@Injectable()
export class AuthJsProviderService {
  private readonly logger = new Logger(AuthJsProviderService.name);
  private readonly authUrl: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const authUrl = this.config.get<string>('NEXTAUTH_URL');
    this.authUrl = authUrl || '';
    this.enabled = !!authUrl;

    if (this.enabled) {
      this.logger.log(`Auth.js provider service enabled: ${this.authUrl}`);
    } else {
      this.logger.warn('Auth.js provider service disabled. Set NEXTAUTH_URL to enable.');
    }
  }

  async getProviderToken(
    authUserId: string,
    provider: 'github' | 'twitter',
  ): Promise<string | null> {
    if (!this.enabled) {
      this.logger.warn(`Provider token access disabled for ${provider}`);
      return null;
    }

    try {
      // Call Auth.js API endpoint to get provider token
      const response = await fetch(
        `${this.authUrl}/api/provider-token?userId=${authUserId}&provider=${provider}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add internal API key if you secure this endpoint
            // 'x-api-key': this.config.get('INTERNAL_API_KEY'),
          },
        }
      );

      if (!response.ok) {
        this.logger.debug(`No ${provider} token found for user ${authUserId}`);
        return null;
      }

      const data = await response.json();
      return data.access_token || null;
    } catch (error) {
      this.logger.error(`Failed to get ${provider} token:`, error);
      return null;
    }
  }

  async getProviderAccount(
    authUserId: string,
    provider: 'github' | 'twitter',
  ): Promise<ProviderAccount | null> {
    if (!this.enabled) {
      this.logger.warn(`Provider account access disabled for ${provider}`);
      return null;
    }

    try {
      const response = await fetch(
        `${this.authUrl}/api/provider-token?userId=${authUserId}&provider=${provider}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        this.logger.debug(`No ${provider} account found for user ${authUserId}`);
        return null;
      }

      const data = await response.json();
      
      if (!data.access_token) {
        return null;
      }

      return {
        provider,
        access_token: data.access_token,
        refresh_token: data.refresh_token || null,
        expires_at: data.expires_at || null,
      };
    } catch (error) {
      this.logger.error(`Failed to get ${provider} account:`, error);
      return null;
    }
  }

  async isProviderLinked(
    authUserId: string,
    provider: 'github' | 'twitter',
  ): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const response = await fetch(
        `${this.authUrl}/api/provider-linked?userId=${authUserId}&provider=${provider}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return false;

      const data = await response.json();
      return data.linked === true;
    } catch (error) {
      this.logger.error(`Failed to check ${provider} link status:`, error);
      return false;
    }
  }
}