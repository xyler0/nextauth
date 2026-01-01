import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
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

@ApiTags('user')
@Controller('user')
@ApiBearerAuth()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly x: XService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@CurrentUser() user: any) {
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
        // Don't return credentials
        xApiKey: false,
        xApiSecret: false,
        xAccessToken: false,
        xAccessSecret: false,
      },
    });

    return profile;
  }

  @Put('settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: any,
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
    @CurrentUser() user: any,
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
    @CurrentUser() user: any,
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
  async verifyXCredentials(@CurrentUser() user: any) {
    const isValid = await this.x.verifyCredentials(user.id);
    return { valid: isValid };
  }
}