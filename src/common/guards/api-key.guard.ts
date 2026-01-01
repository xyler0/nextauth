import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const expectedHash = this.config.get<string>('API_KEY_HASH');

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    if (!expectedHash) {
      throw new Error('API_KEY_HASH not configured');
    }

    const isValid = await bcrypt.compare(apiKey, expectedHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}