import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, Res, UseGuards } from '@nestjs/common';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly configService: ConfigService,
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
   async githubCallback(@Req() req: any, @Res() res: Response) {
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
   async twitterCallback(@Req() req: any, @Res() res: Response) {
     const user = req.user;
     const token = this.auth.generateToken(user.id, user.email);
     
     // Redirect to frontend with token
     const frontendUrl = this.configService.get<string>('FRONTEND_URL'); 
     res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=twitter`);
   }
}