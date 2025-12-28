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

@ApiTags('webhooks')
@Controller('webhooks/github')
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);

  constructor(private readonly githubService: GitHubService) {}

  @Post()
  @UseGuards(GitHubWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Receive GitHub webhooks',
    description: 'Processes push, pull_request, and release events from GitHub'
  })
  @ApiSecurity('X-Hub-Signature-256')
  @ApiResponse({ 
    status: 201, 
    description: 'Webhook processed successfully',
    schema: {
      example: { status: 'processed', summary: 'Shipped: Add new feature' }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid webhook signature' 
  })
  async handleWebhook(@Body() payload: GitHubWebhookDto) {
    this.logger.log('Received GitHub webhook');

    const summary = this.githubService.processWebhook(payload);

    if (summary) {
      this.logger.log(`Webhook processed: ${summary}`);
      return { status: 'processed', summary };
    }

    return { status: 'filtered' };
  }
}