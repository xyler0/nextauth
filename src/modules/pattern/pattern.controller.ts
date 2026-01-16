import {
  Controller,
  Post,
  Get,
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
import { PatternService } from './pattern.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ImportPostsDto } from './dto/import-posts.dto';

@ApiTags('pattern')
@Controller('pattern')
@ApiBearerAuth()
export class PatternController {
  private readonly logger = new Logger(PatternController.name);

  constructor(private readonly patternService: PatternService) {}

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Import posts to learn writing pattern',
    description: 'Analyze multiple posts to learn your writing style',
  })
  @ApiResponse({ status: 200, description: 'Pattern learned successfully' })
  async importPosts(
    @Body() dto: ImportPostsDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Importing ${dto.posts.length} posts for user ${user.id}`);

    // Learn from each post
    for (const post of dto.posts) {
      await this.patternService.learnFromText(user.id, post);
    }

    const pattern = await this.patternService.getPattern(user.id);

    return {
      message: `Learned from ${dto.posts.length} posts`,
      pattern: {
        avgSentenceLength: pattern.avgSentenceLength,
        formalityScore: pattern.formalityScore,
        totalPostsAnalyzed: pattern.totalPostsAnalyzed,
        commonStarters: pattern.commonStarters,
      },
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get your writing pattern profile' })
  @ApiResponse({ status: 200, description: 'Writing pattern profile' })
  async getProfile(@CurrentUser() user: any) {
    const pattern = await this.patternService.getPattern(user.id);

    if (!pattern) {
      return {
        exists: false,
        message: 'No writing pattern learned yet. Import some posts to get started!',
      };
    }

    return {
      exists: true,
      pattern: {
        avgSentenceLength: pattern.avgSentenceLength,
        sentenceLengthRange: {
          min: pattern.minSentenceLength,
          max: pattern.maxSentenceLength,
        },
        formalityScore: pattern.formalityScore,
        styleFeatures: {
          usesEmojis: pattern.usesEmojis,
          usesHashtags: pattern.usesHashtags,
          usesAbbreviations: pattern.usesAbbreviations,
        },
        commonStarters: pattern.commonStarters,
        totalPostsAnalyzed: pattern.totalPostsAnalyzed,
        lastUpdated: pattern.lastUpdated,
      },
    };
  }

  @Get('prompt')
  @ApiOperation({ summary: 'Get personalized tone enforcement prompt' })
  @ApiResponse({ status: 200, description: 'Personalized prompt' })
  async getPrompt(@CurrentUser() user: any) {
    const prompt = await this.patternService.generatePersonalizedPrompt(user.id);
    return { prompt };
  }
}
