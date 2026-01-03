import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GitHubStrategy.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email', 'repo'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    this.logger.log(`GitHub OAuth callback for user: ${profile.username}`);

    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new Error('No email provided by GitHub');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { githubId: profile.id },
    });

    if (!user) {
      // Check if user exists with this email
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link GitHub to existing account
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            githubId: profile.id,
            githubAccessToken: accessToken,
            githubUsername: profile.username,
          },
        });
        this.logger.log(`Linked GitHub account to existing user: ${user.id}`);
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email,
            password: '', // No password for OAuth-only users
            name: profile.displayName || profile.username,
            githubId: profile.id,
            githubAccessToken: accessToken,
            githubUsername: profile.username,
          },
        });
        this.logger.log(`Created new user from GitHub OAuth: ${user.id}`);
      }
    } else {
      // Update existing GitHub-linked account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          githubAccessToken: accessToken,
          githubUsername: profile.username,
        },
      });
    }

    return user;
  }
}