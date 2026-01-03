import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Octokit } from '@octokit/rest';
import { GitHubFilter } from './github.filter';
import { GitHubEvent } from './interfaces/github-event.interface';
import { GitHubWebhookDto } from './dto/github-webhook.dto';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  constructor(
    private readonly filter: GitHubFilter,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  processWebhook(payload: GitHubWebhookDto): string | null {
    const event = this.parsePayload(payload);

    this.logger.debug(`Processing GitHub event: ${event.type} from ${event.repo}`);

    if (!this.filter.shouldProcess(event)) {
      this.logger.debug('Event filtered out');
      return null;
    }

    const summary = this.filter.summarize(event);
    this.logger.log(`Generated summary: ${summary}`);

    return summary;
  }

  async getUserRepositories(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        githubAccessToken: true,
        githubUsername: true,
      },
    });

    if (!user?.githubAccessToken) {
      return [];
    }

    try {
      const octokit = new Octokit({
        auth: user.githubAccessToken,
      });

      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 100,
        sort: 'updated',
      });

      return data.map((repo) => repo.full_name);
    } catch (error) {
      this.logger.error('Failed to fetch GitHub repositories', error);
      return [];
    }
  }

  async verifyToken(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    });

    if (!user?.githubAccessToken) {
      return false;
    }

    try {
      const octokit = new Octokit({
        auth: user.githubAccessToken,
      });

      await octokit.rest.users.getAuthenticated();
      return true;
    } catch (error) {
      this.logger.error('GitHub token verification failed', error);
      return false;
    }
  }

  private parsePayload(payload: GitHubWebhookDto): GitHubEvent {
    return {
      type: payload.action || 'push',
      repo: payload.repository.name,
      commits: payload.commits?.map((c) => ({
        message: c.message,
        author: c.author,
      })),
      pr: payload.pull_request
        ? {
            title: payload.pull_request.title,
            action: payload.action,
          }
        : undefined,
      release: payload.release
        ? {
            tag: payload.release.tag_name,
            name: payload.release.name,
          }
        : undefined,
    };
  }
}