import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { Request } from 'express';

type GitHubValidatedUser = {
  id: string;
  email: string;
  name: string | null;
};

type GitHubRequest = Request & {
  session?: {
    userId?: string;
  };
};

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GitHubStrategy.name);

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID')!,
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET')!,
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL')!,
      scope: ['user:email', 'repo'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: GitHubRequest,
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<GitHubValidatedUser> {
    this.logger.log(`GitHub OAuth callback for user: ${profile.username}`);

    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('No email provided by GitHub');
    }

    const existingUserId = req.session?.userId;

    let user;

    if (existingUserId) {
      user = await this.prisma.user.update({
        where: { id: existingUserId },
        data: {
          githubId: profile.id,
          githubAccessToken: accessToken,
          githubUsername: profile.username,
        },
      });
    } else {
      user = await this.prisma.user.findUnique({
        where: { githubId: profile.id },
      });

      if (!user) {
        const emailUser = await this.prisma.user.findUnique({
          where: { email },
        });

        if (emailUser) {
          user = await this.prisma.user.update({
            where: { id: emailUser.id },
            data: {
              githubId: profile.id,
              githubAccessToken: accessToken,
              githubUsername: profile.username,
            },
          });
        } else {
          user = await this.prisma.user.create({
            data: {
              email,
              password: '',
              name: profile.displayName ?? profile.username,
              githubId: profile.id,
              githubAccessToken: accessToken,
              githubUsername: profile.username,
            },
          });
        }
      } else {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            githubAccessToken: accessToken,
            githubUsername: profile.username,
          },
        });
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
