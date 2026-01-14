// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

type JwtPayload = {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
    
    this.logger.log('JWT Strategy initialized');
  }

  async validate(payload: JwtPayload) {
    this.logger.debug(`Validating JWT for user: ${payload.sub}`);
    
    // Fetch the complete user object from database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        maxPostsPerDay: true,
        timezone: true,
      },
    });

    if (!user) {
      this.logger.warn(`User not found: ${payload.sub}`);
      throw new UnauthorizedException('User not found');
    }

    this.logger.debug(`User validated: ${user.email}`);

    // Return user object that matches AuthUser type
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      maxPostsPerDay: user.maxPostsPerDay,
      timezone: user.timezone,
    };
  }
}