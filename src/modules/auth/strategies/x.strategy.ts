import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from '@superfaceai/passport-twitter-oauth2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class XStrategy extends PassportStrategy(Strategy, 'x') {
  private readonly logger = new Logger(XStrategy.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      clientID: config.get<string>('TWITTER_CLIENT_ID')!,
      clientSecret: config.get<string>('TWITTER_CLIENT_SECRET')!,
      clientType: 'confidential',
      callbackURL: config.get<string>('TWITTER_CALLBACK_URL'),
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    this.logger.log(`Twitter OAuth callback for user: ${profile.username}`);

    const email = profile.emails?.[0]?.value;
    const existingUserId = req.session?.userId;

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

    let user = await this.prisma.user.findUnique({
      where: { xId: profile.id },
    });

    if (!user && email) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });

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
        this.logger.log(`Linked Twitter account to existing user: ${user.id}`);
      } else {
        user = await this.prisma.user.create({
          data: {
            email,
            password: '',
            name: profile.displayName || profile.username,
            xId: profile.id,
            xUsername: profile.username,
            xAccessToken: accessToken,
            xAccessSecret: refreshToken,
          },
        });
        this.logger.log(`Created new user from Twitter OAuth: ${user.id}`);
      }
    } else if (!user) {
      throw new UnauthorizedException('Email is required from Twitter');
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          xAccessToken: accessToken,
          xAccessSecret: refreshToken,
          xUsername: profile.username,
        },
      });
    }

    return user;
  }
}