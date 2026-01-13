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
    config: ConfigService,
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

    const email = profile.emails?.[0]?.value ?? null;
    const existingUserId = req.session?.userId;

    if (existingUserId) {
      return this.prisma.user.update({
        where: { id: existingUserId },
        data: {
          xId: profile.id,
          xUsername: profile.username,
          xAccessToken: accessToken,
          xAccessSecret: refreshToken,
        },
      });
    }

    let user = await this.prisma.user.findUnique({
      where: { xId: profile.id },
    });

    if (!user && email) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        return this.prisma.user.update({
          where: { id: user.id },
          data: {
            xId: profile.id,
            xUsername: profile.username,
            xAccessToken: accessToken,
            xAccessSecret: refreshToken,
          },
        });
      }

      return this.prisma.user.create({
        data: {
          email,
          password: '',
          name: profile.displayName ?? profile.username,
          xId: profile.id,
          xUsername: profile.username,
          xAccessToken: accessToken,
          xAccessSecret: refreshToken,
        },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Email is required from X');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        xAccessToken: accessToken,
        xAccessSecret: refreshToken,
        xUsername: profile.username,
      },
    });
  }
}