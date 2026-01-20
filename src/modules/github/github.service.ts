import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
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
    this.logger.warn(
      'getUserRepositories: GitHub tokens now managed by Auth.js. ' +
      'This method returns empty array. Implement Auth.js provider token access.'
    );
    return [];
  }

  async verifyToken(userId: string): Promise<boolean> {
    this.logger.warn(
      'verifyToken: GitHub tokens now managed by Auth.js. ' +
      'This method returns false. Implement Auth.js provider token access.'
    );
      return false;
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