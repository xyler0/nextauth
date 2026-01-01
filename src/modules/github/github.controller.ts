import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { GitHubService } from './github.service';
import { GitHubWebhookGuard } from './guards/github-webhook.guard';
import { GitHubWebhookDto } from './dto/github-webhook.dto';
import { ComposerService } from '../composer/composer.service';
import { PrismaService } from '../../database/prisma.service';
import { PostSource } from '../../generated/prisma/client';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('webhooks')
@Controller('webhooks/github')
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);

  constructor(
    private readonly githubService: GitHubService,
    private readonly composer: ComposerService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Public() // Webhooks don't use JWT auth
  @UseGuards(GitHubWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive GitHub webhooks',
    description: 'Processes push, pull_request, and release events from GitHub',
  })
  @ApiSecurity('X-Hub-Signature-256')
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(@Body() payload: GitHubWebhookDto) {
    this.logger.log('Received GitHub webhook');

    const summary = this.githubService.processWebhook(payload);

    if (!summary) {
      return { status: 'filtered' };
    }

    // Find user monitoring this repository
    const repoFullName = payload.repository.full_name;
    
    const users = await this.prisma.user.findMany({
      where: {
        githubRepos: {
          has: repoFullName,
        },
      },
      select: {
        id: true,
        maxPostsPerDay: true,
      },
    });

    if (users.length === 0) {
      this.logger.log(`No users monitoring repository: ${repoFullName}`);
      return { status: 'no_subscribers' };
    }

    // Post for each user monitoring this repo
    const results: { userId: string; posted: boolean; reason: string | undefined; }[] = [];
    for (const user of users) {
      const result = await this.composer.compose(
        summary,
        PostSource.GITHUB,
        user.id,
        user.maxPostsPerDay,
        {
          repository: repoFullName,
          action: payload.action,
        },
      );

      results.push({
        userId: user.id,
        posted: result.posted,
        reason: result.reason,
      });
    }

    return {
      status: 'processed',
      results,
    };
  }
}