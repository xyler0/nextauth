import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhooks } from '@octokit/webhooks';

@Injectable()
export class GitHubWebhookGuard implements CanActivate {
  private webhooks: Webhooks;

  constructor(private config: ConfigService) {
    const secret = this.config.get<string>('GITHUB_WEBHOOK_SECRET');

    if (!secret) {
      throw new Error('GITHUB_WEBHOOK_SECRET not configured');
    }

    this.webhooks = new Webhooks({ secret });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const signature = request.headers['x-hub-signature-256'];
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const payload = JSON.stringify(request.body);

    try {
      await this.webhooks.verifyAndReceive({
        id: request.headers['x-github-delivery'],
        name: request.headers['x-github-event'],
        signature,
        payload,
      });
    } catch {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}
