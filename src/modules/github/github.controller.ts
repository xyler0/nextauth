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
import { PostSource } from '../../generated/prisma/client';

@ApiTags('webhooks')
@Controller('webhooks/github')
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);

  constructor(
    private readonly githubService: GitHubService,
    private readonly composer: ComposerService,
  ) {}

  @Post()
  @UseGuards(GitHubWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive GitHub webhooks',
    description: 'Processes push, pull_request, and release events from GitHub',
  })
  @ApiSecurity('X-Hub-Signature-256')
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid webhook signature',
  })
  async handleWebhook(@Body() payload: GitHubWebhookDto) {
    this.logger.log('Received GitHub webhook');

    const summary = this.githubService.processWebhook(payload);

    if (!summary) {
      return { status: 'filtered' };
    }

    // Compose and post
    const result = await this.composer.compose(summary, PostSource.GITHUB, {
      repository: payload.repository.full_name,
      action: payload.action,
    });

    return {
      status: result.posted ? 'posted' : 'skipped',
      reason: result.reason,
    };
  }
}