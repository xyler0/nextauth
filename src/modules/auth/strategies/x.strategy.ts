import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from '@superfaceai/passport-twitter-oauth2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { Request } from 'express';

type SessionRequest = Request & {
  session?: {
    userId?: string;
  };
};

type XProfile = {
  id: string;
  username: string;
  displayName?: string;
  emails?: { value: string }[];
};

@Injectable()
export class XStrategy extends PassportStrategy(Strategy, 'x') {
  private readonly logger = new Logger(XStrategy.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      clientID: config.get<string>('TWITTER_CLIENT_ID')!,
      clientSecret: config.get<string>('TWITTER_CLIENT_SECRET')!,
      clientType: 'confidential',
      callbackURL: config.get<string>('TWITTER_CALLBACK_URL')!,
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: SessionRequest,
    accessToken: string,
    refreshToken: string,
    profile: XProfile,
  ) {
    this.logger.log(`X OAuth callback for user: ${profile.username}`);

    const email = profile.emails?.[0]?.value || `${profile.username}@twitter.placeholder`;
    const existingUserId = req.session?.userId;

    // Linking Twitter to an existing session user
    if (existingUserId) {
      const user = await this.prisma.user.update({
        where: { id: existingUserId },
        data: {
          xId: profile.id,
          xUsername: profile.username,
          xAccessToken: accessToken,
          xAccessSecret: refreshToken,
        },
      });
      this.logger.log(`Linked Twitter to user: ${user.id}`);
      return user;
    }

    // Find by Twitter ID
    let user = await this.prisma.user.findUnique({
      where: { xId: profile.id },
    });

    if (user) {
      // Update tokens if user exists
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          xAccessToken: accessToken,
          xAccessSecret: refreshToken,
          xUsername: profile.username,
        },
      });
      this.logger.log(`Updated existing Twitter user: ${user.id}`);
      return user;
    }

    // Find by email if available and not placeholder
    if (email && !email.includes('@twitter.placeholder')) {
      user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            xId: profile.id,
            xUsername: profile.username,
            xAccessToken: accessToken,
            xAccessSecret: refreshToken,
          },
        });
        this.logger.log(`Linked Twitter to existing email account: ${user.id}`);
        return user;
      }
    }

    // Create new user
    user = await this.prisma.user.create({
      data: {
        email,
        password: '', // OAuth users don't need password
        name: profile.displayName || profile.username,
        xId: profile.id,
        xUsername: profile.username,
        xAccessToken: accessToken,
        xAccessSecret: refreshToken,
      },
    });

    this.logger.log(`Created new user from Twitter OAuth: ${user.id}`);
    return user;
  }
}
