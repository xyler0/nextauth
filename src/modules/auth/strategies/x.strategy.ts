import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from '@superfaceai/passport-twitter-oauth2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class XStrategy extends PassportStrategy(Strategy, 'x') {
  private readonly logger = new Logger(XStrategy.name);

  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      clientID: config.get<string>('TWITTER_CLIENT_ID')!,
      clientSecret: config.get<string>('TWITTER_CLIENT_SECRET')!,
      callbackURL: config.get<string>('TWITTER_CALLBACK_URL')!,
      clientType: 'confidential',
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    this.logger.log(`X OAuth callback for ${profile.username}`);

    let linkingUserId: string | null = null;
    const state = req.query?.state;

    if (state) {
      try {
        const decoded = JSON.parse(
          Buffer.from(state, 'base64').toString('utf-8'),
        );
        linkingUserId = decoded.userId;
      } catch {
        throw new UnauthorizedException('Invalid state');
      }
    }

    if (linkingUserId) {
      const user = await this.prisma.user.update({
        where: { id: linkingUserId },
        data: {
          xId: profile.id,
          xUsername: profile.username,
          xAccessToken: accessToken,
          xAccessSecret: refreshToken,
        },
      });

      this.logger.log(`Linked X to user ${user.id}`);
      return user;
    }

    let user = await this.prisma.user.findUnique({
      where: { xId: profile.id },
    });

    if (user) {
      return this.prisma.user.update({
        where: { id: user.id },
        data: {
          xAccessToken: accessToken,
          xAccessSecret: refreshToken,
          xUsername: profile.username,
        },
      });
    }

    const email = `${profile.id}@x.oauth`;

    user = await this.prisma.user.create({
      data: {
        email,
        password: '', // OAuth-only
        name: profile.name ?? profile.username,
        xId: profile.id,
        xUsername: profile.username,
        xAccessToken: accessToken,
        xAccessSecret: refreshToken,
      },
    });

    return user;
  }
}
