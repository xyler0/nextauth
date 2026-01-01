import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ComposerService } from '../composer/composer.service';
import { StoreService } from '../store/store.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PostSource } from '../../generated/prisma/client';
import { ManualPostDto } from './dto/manual-post.dto';

@ApiTags('posts')
@Controller('posts')
@ApiBearerAuth()
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(
    private readonly composer: ComposerService,
    private readonly store: StoreService,
  ) {}

  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create and post manually',
    description: 'Manually create a post with tone enforcement and post to X',
  })
  @ApiResponse({
    status: 201,
    description: 'Post created and published',
    schema: {
      example: {
        posted: true,
        postId: 'clx123456',
        content: 'Shipped a new feature. System now filters commits automatically.',
      },
    },
  })
  async manualPost(
    @Body() dto: ManualPostDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Manual post requested by user ${user.id}`);

    const result = await this.composer.compose(
      dto.content,
      PostSource.JOURNAL, // Treat manual posts as journal
      user.id,
      user.maxPostsPerDay,
      { manual: true },
    );

    return {
      posted: result.posted,
      postId: result.postId,
      reason: result.reason,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user posts' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of posts' })
  async getUserPosts(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ) {
    return this.store.getUserPosts(user.id, limit || 50);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get posting statistics' })
  @ApiResponse({
    status: 200,
    description: 'User posting stats',
    schema: {
      example: {
        todayCount: 2,
        maxPerDay: 3,
        canPostToday: true,
        remaining: 1,
      },
    },
  })
  async getStats(@CurrentUser() user: any) {
    const todayCount = await this.store.getTodayPostCount(user.id);
    const maxPerDay = user.maxPostsPerDay;
    const canPostToday = await this.store.canPostToday(user.id, maxPerDay);

    return {
      todayCount,
      maxPerDay,
      canPostToday,
      remaining: maxPerDay - todayCount,
    };
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete a post',
    description: 'Delete from database (does not delete from X)',
  })
  @ApiResponse({ status: 200, description: 'Post deleted' })
  async deletePost(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    // Verify ownership before deletion
    const post = await this.store.getPostById(id, user.id);
    
    await this.store.deletePost(id);
    
    return { message: 'Post deleted successfully' };
  }
}