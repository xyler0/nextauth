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
  session: {
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

    const existingUserId = req.session.userId;

    // Linking GitHub to an existing session user
    if (existingUserId) {
      const user = await this.prisma.user.update({
        where: { id: existingUserId },
        data: {
          githubId: profile.id,
          githubAccessToken: accessToken,
          githubUsername: profile.username,
        },
      });
      this.logger.log(`Linked GitHub to user: ${user.id}`);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }

    // Find by GitHub ID
    let user = await this.prisma.user.findUnique({
      where: { githubId: profile.id },
    });

    if (user) {
      // Update tokens if user exists
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          githubAccessToken: accessToken,
          githubUsername: profile.username,
        },
      });
      this.logger.log(`Updated existing GitHub user: ${user.id}`);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }

    // Find by email
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
      this.logger.log(`Linked GitHub to existing email account: ${user.id}`);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }

    // Create new user
    user = await this.prisma.user.create({
      data: {
        email,
        password: '', // OAuth users don't need password
        name: profile.displayName ?? profile.username,
        githubId: profile.id,
        githubAccessToken: accessToken,
        githubUsername: profile.username,
      },
    });

    this.logger.log(`Created new user from GitHub OAuth: ${user.id}`);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}