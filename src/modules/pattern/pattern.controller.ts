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
import { SubmitFeedbackDto } from './dto/feedback.dto';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('pattern')
@Controller('pattern')
@ApiBearerAuth()
export class PatternController {
  private readonly logger = new Logger(PatternController.name);

  constructor(
    private readonly patternService: PatternService,
    private readonly prisma: PrismaService
  ) {}

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
    if (!pattern) return { avgSentenceLength: 0, formalityScore: 0, totalPostsAnalyzed: 0, commonStarters: [] };


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

  @Post('feedback')
@HttpCode(HttpStatus.CREATED)
@ApiOperation({
  summary: 'Submit feedback on generated post',
  description: 'Help improve your writing pattern by rating posts',
})
@ApiResponse({ status: 201, description: 'Feedback recorded' })
async submitFeedback(
  @Body() dto: SubmitFeedbackDto,
  @CurrentUser() user: any,
) {
  // Save feedback
  const feedback = await this.prisma.trainingFeedback.create({
    data: {
      userId: user.id,
      originalText: dto.originalText,
      generatedText: dto.generatedText,
      editedText: dto.editedText,
      rating: dto.rating,
      feedback: dto.feedback,
      accepted: dto.accepted,
    },
  });

  // If user edited the text, learn from their edit
  if (dto.editedText && dto.accepted) {
    await this.patternService.learnFromText(user.id, dto.editedText);
    this.logger.log(`Learned from user edit for user ${user.id}`);
  }

  return {
    message: 'Feedback recorded. Thank you!',
    feedbackId: feedback.id,
  };
}

@Get('feedback')
@ApiOperation({ summary: 'Get your feedback history' })
@ApiResponse({ status: 200, description: 'Feedback history' })
async getFeedback(@CurrentUser() user: any) {
  const feedback = await this.prisma.trainingFeedback.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      originalText: true,
      generatedText: true,
      editedText: true,
      rating: true,
      feedback: true,
      accepted: true,
      createdAt: true,
    },
  });

  return { feedback };
}

@Get('stats')
@ApiOperation({ summary: 'Get learning statistics' })
@ApiResponse({ 
  status: 200, 
  description: 'Pattern learning statistics',
  schema: {
    example: {
      hasPattern: true,
      totalPostsAnalyzed: 25,
      avgRating: 4.2,
      acceptanceRate: 0.85,
      topStarters: ['Shipped', 'Built', 'Fixed'],
    }
  }
})
async getStats(@CurrentUser() user: any) {
  const pattern = await this.patternService.getPattern(user.id);
  
  // Get feedback stats
  const feedback = await this.prisma.trainingFeedback.findMany({
    where: { userId: user.id },
    select: {
      rating: true,
      accepted: true,
    },
  });

  const avgRating = feedback.length > 0
    ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
    : 0;

  const acceptanceRate = feedback.length > 0
    ? feedback.filter(f => f.accepted).length / feedback.length
    : 0;

  return {
    hasPattern: !!pattern,
    totalPostsAnalyzed: pattern?.totalPostsAnalyzed || 0,
    feedbackCount: feedback.length,
    avgRating: avgRating.toFixed(1),
    acceptanceRate: (acceptanceRate * 100).toFixed(0) + '%',
    topStarters: pattern?.commonStarters || [],
    avgSentenceLength: pattern?.avgSentenceLength?.toFixed(1) || 0,
    formalityScore: pattern?.formalityScore?.toFixed(1) || 0,
  };
}

}
