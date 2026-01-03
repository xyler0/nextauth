import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import axios from 'axios';

interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
  };
}

@Injectable()
export class XStrategy extends PassportStrategy(Strategy, 'x') {
  private readonly logger = new Logger(XStrategy.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      authorizationURL: 'https://twitter.com/i/oauth2/authorize',
      tokenURL: 'https://api.twitter.com/2/oauth2/token',
      clientID: config.get<string>('TWITTER_CONSUMER_KEY')!,
      clientSecret: config.get<string>('TWITTER_CONSUMER_SECRET')!,
      callbackURL: config.get<string>('TWITTER_CALLBACK_URL')!,
      scope: ['tweet.read', 'users.read', 'offline.access'],
      pkce: true,
      state: true,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
  ): Promise<any> {
    // Fetch X user profile
    const { data } = await axios.get<TwitterUserResponse>(
      'https://api.twitter.com/2/users/me',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const xProfile = data?.data;
    if (!xProfile?.id) {
      throw new Error('Invalid X user profile');
    }

    this.logger.log(`X OAuth callback for user: ${xProfile.username}`);

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { xId: xProfile.id },
    });

    if (!user) {
      // Try linking by email-style placeholder
      const pseudoEmail = `${xProfile.id}@x.oauth`;

      user = await this.prisma.user.findUnique({
        where: { email: pseudoEmail },
      });

      if (user) {
        // Link X account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            xId: xProfile.id,
            xUsername: xProfile.username,
            xAccessToken: accessToken,
            xAccessSecret: refreshToken ?? null,
          },
        });

        this.logger.log(
          `Linked X account to existing user: ${user.id}`,
        );
      } else {
        // Create new OAuth-only user
        user = await this.prisma.user.create({
          data: {
            email: pseudoEmail,
            password: '',
            name: xProfile.username,
            xId: xProfile.id,
            xUsername: xProfile.username,
            xAccessToken: accessToken,
            xAccessSecret: refreshToken ?? null,
          },
        });

        this.logger.log(
          `Created new user from X OAuth: ${user.id}`,
        );
      }
    } else {
      // Update existing X-linked user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          xUsername: xProfile.username,
          xAccessToken: accessToken,
          xAccessSecret: refreshToken ?? null,
        },
      });
    }

    return user;
  }
}
