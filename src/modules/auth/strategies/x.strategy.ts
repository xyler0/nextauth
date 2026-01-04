import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
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
      scope: ['tweet.read', 'users.read'],
      state: true,
      pkce: true,
      passReqToCallback: true,
     });
    }
    async validate(
  req: any,
  accessToken: string,
  //refreshToken: string,
): Promise<any> {
  // 1. Fetch X profile
  const { data } = await axios.get<TwitterUserResponse>(
    'https://api.twitter.com/2/users/me',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { 'user.fields': 'id,name,username' },
    },
  );

  const xId = data.data.id;
  const username = data.data.username;

  // 2. Decode intent from OAuth state
  const linkUserId = req.oauthState?.linkUserId ?? null;

  // ACCOUNT LINKING (explicit)
  if (linkUserId) {
    const alreadyLinked = await this.prisma.user.findFirst({
      where: { xId, NOT: { id: linkUserId } },
    });

    if (alreadyLinked) {
      throw new UnauthorizedException('X account already linked');
    }

    return this.prisma.user.update({
      where: { id: linkUserId },
      data: {
        xId,
        xUsername: username,
        xAccessToken: accessToken,
      //xRefreshToken: refreshToken ?? null,
      },
    });
  }

  // LOGIN (existing X user)
  const existingUser = await this.prisma.user.findUnique({
    where: { xId },
  });

  if (existingUser) {
    return this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        xUsername: username,
        xAccessToken: accessToken,
      //xRefreshToken: refreshToken ?? null,
      },
    });
  }

  // SIGNUP (new X user)
  return this.prisma.user.create({
    data: {
      email: `${xId}@x.oauth`,
      password: '',
      name: username,
      xId,
      xUsername: username,
      xAccessToken: accessToken,
    //xRefreshToken: refreshToken ?? null,
    },
  });
}
}
