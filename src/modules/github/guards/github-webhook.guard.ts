import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from '@octokit/webhooks-methods';

@Injectable()
export class GitHubWebhookGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-hub-signature-256'];
    const secret = this.config.get<string>('GITHUB_WEBHOOK_SECRET');

    if (!signature || !secret) {
      throw new UnauthorizedException('Missing webhook signature or secret');
    }

    const payload = JSON.stringify(request.body);
    const isValid = await verify(secret, payload, signature);

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}