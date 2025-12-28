import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GitHubService } from './github.service';
import { GitHubWebhookGuard } from './guards/github-webhook.guard';
import { GitHubWebhookDto } from './dto/github-webhook.dto';

@Controller('webhooks/github')
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);

  constructor(private readonly githubService: GitHubService) {}

  @Post()
  @UseGuards(GitHubWebhookGuard)
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: GitHubWebhookDto) {
    this.logger.log('Received GitHub webhook');

    const summary = this.githubService.processWebhook(payload);

    if (summary) {
      this.logger.log(`Webhook processed: ${summary}`);
      // TODO: Pass to composer service
      return { status: 'processed', summary };
    }

    return { status: 'filtered' };
  }
}