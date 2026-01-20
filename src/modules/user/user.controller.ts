import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
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
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { GitHubService } from '../github/github.service';
import { SelectReposDto } from './dto/select-repos.dto';

interface CurrentUserType {
  id: string;
  email: string;
  name?: string | null;
  maxPostsPerDay: number;
  timezone: string;
}

@ApiTags('user')
@Controller('user')
@ApiBearerAuth('JWT')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly x: XService,
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
        githubRepos: true,
        createdAt: true,
        authUserId: true,
      },
    });
    
    if (!profile) {
      throw new NotFoundException('User not found.');
    }

    return profile;
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

  @Get('x-credentials/verify')
  @ApiOperation({ summary: 'Verify X credentials' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyXCredentials(@CurrentUser() user: CurrentUserType) {
    const isValid = await this.x.verifyCredentials(user.id);
    return { valid: isValid };
  }
}