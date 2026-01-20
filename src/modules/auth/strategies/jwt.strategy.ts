import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

type JwtPayload = {
  sub: string;        // Auth.js user ID
  email: string;
  name?: string;
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
      secretOrKey: config.get<string>('NEXTAUTH_SECRET')!, // Same secret as Auth.js
      issuer: config.get<string>('NEXTAUTH_URL'), // Auth.js issuer
      audience: config.get<string>('NEXTAUTH_URL'), // Auth.js audience
    });
    
    this.logger.log('JWT Strategy initialized for Auth.js tokens');
  }

  async validate(payload: JwtPayload) {
    this.logger.debug(`Validating Auth.js JWT for user: ${payload.sub}`);
    
    // Find or create internal user based on authUserId
    let user = await this.prisma.user.findUnique({
      where: { authUserId: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        maxPostsPerDay: true,
        timezone: true,
        authUserId: true,
      },
    });

    // If user doesn't exist in our system, create them
    if (!user) {
      this.logger.log(`Creating internal user for Auth.js user: ${payload.sub}`);
      user = await this.prisma.user.create({
        data: {
          authUserId: payload.sub,
          email: payload.email,
          name: payload.name || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          maxPostsPerDay: true,
          timezone: true,
          authUserId: true,
        },
      });
    }

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