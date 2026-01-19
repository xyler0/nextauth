import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, Res, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { GitHubOAuthGuard } from '../../common/guards/github-oauth.guard';
import { XOAuthGuard } from 'src/common/guards/x-oauth.guard';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { OAuthUser } from 'src/common/types/oauth-user.type';
import { JwtUser } from 'src/common/types/jwt-user.type';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';


interface OAuthRequest extends Request {
  user: OAuthUser;
}

type SessionRequest = Request & {
  session: {
    userId?: string;
  };
  sessionID?: string;
};


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly auth: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService, 
  ) {}

  @Post('signup')
  @Public()
  @ApiOperation({ summary: 'Create new user account' })
  @ApiResponse({ status: 201, description: 'User created', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async signup(@Body() dto: SignupDto): Promise<AuthResponseDto> {
    return this.auth.signup(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login to existing account' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto);
  }

   @Get('github')
   @Public()
   @UseGuards(GitHubOAuthGuard)
   @ApiOperation({ summary: 'Initiate GitHub OAuth flow' })
   @ApiResponse({ status: 302, description: 'Redirects to GitHub' })
   async githubAuth() {
   }
 
   @Get('github/callback')
   @Public()
   @UseGuards(GitHubOAuthGuard)
   @ApiOperation({ summary: 'GitHub OAuth callback' })
   async githubCallback(@Req() req: OAuthRequest, @Res() res: Response) {
     const user = req.user;
     const token = this.auth.generateToken(user.id, user.email);
     
     // Redirect to frontend with token
     const frontendUrl = this.configService.get<string>('FRONTEND_URL'); 
     res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=github`);
   }
   @Get('twitter')
   @Public()
   @UseGuards(XOAuthGuard)
   @ApiOperation({ summary: 'Initiate Twitter OAuth flow' })
   @ApiResponse({ status: 302, description: 'Redirects to Twitter' })
   async twitterAuth() {
   }
 
   @Get('twitter/callback')
   @Public()
   @UseGuards(XOAuthGuard)
   @ApiOperation({ summary: 'Twitter OAuth callback' })
   async twitterCallback(@Req() req: OAuthRequest, @Res() res: Response) {
     const user = req.user;
     const token = this.auth.generateToken(user.id, user.email);
     
     // Redirect to frontend with token
     const frontendUrl = this.configService.get<string>('FRONTEND_URL'); 
     res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=twitter`);
   }

   @Get('link/github')
@ApiOperation({ summary: 'Link GitHub to existing account (token in query)' })
@ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth' })
async linkGitHub(
  @Query('token') token: string,
  @Req() req: SessionRequest,
  @Res() res: Response,
) {
  const frontendUrl = this.configService.get<string>('FRONTEND_URL');

  this.logger.log('=== GitHub Link Request ===');
  this.logger.log(`Token received: ${token ? 'Yes' : 'No'}`);
  this.logger.log(`Token length: ${token?.length}`);

  if (!token) {
    this.logger.warn('GitHub link attempted without token');
    return res.redirect(`${frontendUrl}/settings?error=missing_token`);
  }

  try {
    this.logger.log('Attempting to verify token...');
    const payload = this.jwtService.verify(token);
    this.logger.log('Token verified successfully');
    this.logger.log(`Payload:`, payload);
    
    const userId = payload.sub;

    if (!req.session) {
      req.session = {} as any;
    }
    req.session.userId = userId;

    this.logger.log('=== GitHub Link Initiated ===');
    this.logger.log(`User ID from token: ${userId}`);
    this.logger.log(`Session ID: ${req.sessionID}`);
    this.logger.log(`Session userId set to: ${req.session!.userId}`);
    this.logger.log(`Session object:`, req.session);

    res.redirect('/auth/github');
  } catch (error: any) {
    this.logger.error('=== Token Verification Failed ===');
    this.logger.error(`Error name: ${error.name}`);
    this.logger.error(`Error message: ${error.message}`);
    this.logger.error(`Full error:`, error);
    res.redirect(`${frontendUrl}/settings?error=invalid_token`);
  }
}

@Get('link/twitter')
@ApiOperation({ summary: 'Link Twitter - accepts token in query' })
@ApiResponse({ status: 302, description: 'Redirects to Twitter OAuth' })
async linkTwitter(
  @Query('token') token: string,
  @Req() req: SessionRequest,
  @Res() res: Response,
) {
  const frontendUrl = this.configService.get<string>('FRONTEND_URL');

  if (!token) {
    this.logger.warn('Twitter link attempted without token');
    return res.redirect(`${frontendUrl}/settings?error=missing_token`);
  }

  try {
    // Verify JWT token from query parameter
    const payload = this.jwtService.verify(token);
    const userId = payload.sub;

    // Store user ID in session for linking
    if (!req.session) {
      req.session = {} as any;
    }
    req.session.userId = userId;

    this.logger.log('=== Twitter Link Initiated ===');
    this.logger.log(`User ID from token: ${userId}`);
    this.logger.log(`Session ID: ${req.sessionID}`);
    this.logger.log(`Session userId set to: ${req.session.userId}`);
    this.logger.log(`Session object:`, req.session);

    // Redirect to the Twitter OAuth flow
    res.redirect('/auth/twitter');
  } catch (error) {
    this.logger.error('Invalid token for Twitter linking:', error.message);
    res.redirect(`${frontendUrl}/settings?error=invalid_token`);
  }
}
@Get('test/jwt')
@ApiOperation({ summary: 'Test JWT signing and verification' })
async testJwt() {
  try {
    const testToken = this.jwtService.sign({ sub: 'test123', email: 'test@test.com' });
    const verified = this.jwtService.verify(testToken);
    
    return {
      success: true,
      token: testToken,
      verified,
      secret: this.configService.get('JWT_SECRET')?.substring(0, 10) + '...', // Only show first 10 chars
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

   @Post('logout')
   @HttpCode(HttpStatus.OK)
   @ApiOperation({ 
     summary: 'Logout user',
     description: 'Client should discard the JWT token',
   })
   @ApiResponse({ 
     status: 200, 
     description: 'Logout successful',
   })
   async logout(@CurrentUser() user: JwtUser) {
     this.logger.log(`User ${user.id} logged out`);
     
     return {
       message: 'Logged out successfully',
       // Note: JWT is stateless, so client must discard the token
       // For enhanced security, implement token blacklist if needed
     };
   }
}