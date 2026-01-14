import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Delete,
  Req,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { XService } from '../x/x.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateXCredentialsDto } from './dto/update-x-credentials.dto';
import { UpdateGitHubSettingsDto } from './dto/update-github-settings.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { LinkAccountResponseDto } from './dto/link-account-response.dto';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { GitHubOAuthGuard } from 'src/common/guards/github-oauth.guard';
import { XOAuthGuard } from 'src/common/guards/x-oauth.guard';
import { Response, Request } from 'express';
import { GitHubService } from '../github/github.service';
import { SelectReposDto } from './dto/select-repos.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

interface CurrentUserType {
  id: string;
  email?: string;
  name?: string;
  maxPostsPerDay?: number;
  githubId?: string | null;
  githubUsername?: string | null;
  githubRepos?: string[] | null;
  xId?: string | null;
  xUsername?: string | null;
}

type SessionRequest = Request & {
  session?: {
    userId?: string;
  };
};

@UseGuards(JwtAuthGuard)
@ApiTags('user')
@Controller('user')
@ApiBearerAuth()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly x: XService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly github: GitHubService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@CurrentUser() user: CurrentUserType) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        maxPostsPerDay: true,
        timezone: true,
        githubUsername: true,
        githubRepos: true,
        createdAt: true,
        githubId: true,
        xId: true,
      },
    });
     if (!profile) {
      throw new NotFoundException('User not found.');
    }

    return {
      ...profile,
      linkedAccounts: {
        github: !!profile.githubId,
        twitter: !!profile.xId,
      },
    };
  }

  @Put('settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: dto,
    });

    this.logger.log(`Settings updated for user ${user.id}`);
    return { message: 'Settings updated successfully' };
  }

  @Put('x-credentials')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update X/Twitter credentials' })
  @ApiResponse({ status: 200, description: 'Credentials updated' })
  async updateXCredentials(
    @Body() dto: UpdateXCredentialsDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        xApiKey: dto.xApiKey,
        xApiSecret: dto.xApiSecret,
        xAccessToken: dto.xAccessToken,
        xAccessSecret: dto.xAccessSecret,
      },
    });

    // Verify credentials
    const isValid = await this.x.verifyCredentials(user.id);

    this.logger.log(`X credentials updated for user ${user.id}, valid: ${isValid}`);
    return {
      message: 'X credentials updated',
      verified: isValid,
    };
  }

  @Put('github-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update GitHub monitoring settings' })
  @ApiResponse({ status: 200, description: 'GitHub settings updated' })
  async updateGitHubSettings(
    @Body() dto: UpdateGitHubSettingsDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: dto,
    });

    this.logger.log(`GitHub settings updated for user ${user.id}`);
    return { message: 'GitHub settings updated successfully' };
  }

  @Get('x-credentials/verify')
  @ApiOperation({ summary: 'Verify X credentials' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyXCredentials(@CurrentUser() user: CurrentUserType) {
    const isValid = await this.x.verifyCredentials(user.id);
    return { valid: isValid };
  }
   @Get('link/github')
  @UseGuards(GitHubOAuthGuard)
  @ApiOperation({ summary: 'Link GitHub account via OAuth' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub' })
  async linkGitHub() {
    // Guard handles redirect
  }

  @Get('link/github/callback')
  @UseGuards(GitHubOAuthGuard)
  @ApiOperation({ summary: 'GitHub link callback' })
  async linkGitHubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as CurrentUserType;
    
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/settings?linked=github&success=true`);
  }

  @Get('link/twitter')
  @UseGuards(XOAuthGuard)
  @ApiOperation({ summary: 'Link Twitter account via OAuth' })
  @ApiResponse({ status: 302, description: 'Redirects to Twitter' })
  async linkTwitter() {
  }
  
  @Get('link/twitter/callback')
  @UseGuards(XOAuthGuard)
  @ApiOperation({ summary: 'Twitter link callback' })
  async linkTwitterCallback(@Req() req: SessionRequest, @Res() res: Response) {
    if (req.user && !req.session?.userId) {
      const user = req.user as CurrentUserType;
    }
  
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/settings?linked=twitter&success=true`);
  }
  
  @Delete('link/github')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink GitHub account' })
  @ApiResponse({ 
    status: 200, 
    description: 'GitHub account unlinked',
    type: LinkAccountResponseDto,
  })
  async unlinkGitHub(@CurrentUser() user: CurrentUserType): Promise<LinkAccountResponseDto> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        githubId: null,
        githubAccessToken: null,
        githubUsername: null,
        githubRepos: [],
      },
    });

    this.logger.log(`GitHub account unlinked for user ${user.id}`);

    return {
      message: 'GitHub account unlinked successfully',
      linked: false,
      provider: 'github',
    };
  }

  @Delete('link/twitter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink Twitter account' })
  @ApiResponse({ 
    status: 200, 
    description: 'Twitter account unlinked',
    type: LinkAccountResponseDto,
  })
  async unlinkTwitter(@CurrentUser() user: CurrentUserType): Promise<LinkAccountResponseDto> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        xId: null,
        xUsername: null,
        xAccessToken: null,
        xAccessSecret: null,
      },
    });

    this.logger.log(`Twitter account unlinked for user ${user.id}`);

    return {
      message: 'Twitter account unlinked successfully',
      linked: false,
      provider: 'twitter',
    };
  }

  @Get('connections')
  @ApiOperation({ summary: 'Get linked account status' })
  @ApiResponse({
    status: 200,
    description: 'Linked accounts',
    schema: {
      example: {
        github: { linked: true, username: 'johndoe' },
        twitter: { linked: true, username: '@johndoe' },
      },
    },
  })
  async getConnections(@CurrentUser() user: CurrentUserType) {
    const userData = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        githubId: true,
        githubUsername: true,
        xId: true,
        xUsername: true,
      },
    });

     if (!userData) {
      throw new NotFoundException('User not found.');
    }

    return {
      github: {
        linked: !!userData.githubId,
        username: userData.githubUsername,
      },
      twitter: {
        linked: !!userData.xId,
        username: userData.xUsername,
      },
    };
  }
   @Get('github/repositories')
  @ApiOperation({ 
    summary: 'Get user GitHub repositories',
    description: 'Fetch all repositories from linked GitHub account',
  })
  @ApiResponse({
    status: 200,
    description: 'List of repositories',
    schema: {
      example: {
        repositories: ['username/repo1', 'username/repo2'],
        monitored: ['username/repo1'],
      },
    },
  })
  async getGitHubRepositories(@CurrentUser() user: CurrentUserType) {
    const repositories = await this.github.getUserRepositories(user.id);
    
    const userData = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { githubRepos: true },
    });

     if (!userData) {
      throw new NotFoundException('User not found.');
    }

    return {
      repositories,
      monitored: userData.githubRepos || [],
    };
  }

  @Put('github/repositories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Select repositories to monitor',
    description: 'Choose which repositories should trigger posts',
  })
  @ApiResponse({ status: 200, description: 'Repositories updated' })
  async selectRepositories(
    @Body() dto: SelectReposDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        githubRepos: dto.repos,
      },
    });

    this.logger.log(`Updated monitored repos for user ${user.id}: ${dto.repos.join(', ')}`);

    return {
      message: 'Repositories updated successfully',
      monitored: dto.repos,
    };
  }

  @Get('github/verify')
  @ApiOperation({ summary: 'Verify GitHub connection' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyGitHub(@CurrentUser() user: CurrentUserType) {
    const isValid = await this.github.verifyToken(user.id);
    return { valid: isValid };
  }
}