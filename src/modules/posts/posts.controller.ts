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

interface ComposerResult {
  posted: boolean;
  postId?: string;
  reason?: string;
}

@ApiTags('posts')
@Controller('posts')
@ApiBearerAuth('JWT') 
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
  })
  async manualPost(
    @Body() dto: ManualPostDto,
    @CurrentUser() user: { id: string; maxPostsPerDay: number },
  ): Promise<{ posted: boolean; postId?: string; reason?: string }> {
    this.logger.log(`Manual post requested by user ${user.id}`);

    const result = await this.composer.compose(
       dto.content,
       PostSource.JOURNAL,
       user.id,
       user.maxPostsPerDay,
       { manual: true },
       ) as ComposerResult;

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
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Number(limit) : 50;
    return this.store.getUserPosts(user.id, take);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get posting statistics' })
  @ApiResponse({
    status: 200,
    description: 'User posting stats',
  })
  async getStats(
    @CurrentUser() user: { id: string; maxPostsPerDay: number },
  ) {
    const todayCount = await this.store.getTodayPostCount(user.id);
    const maxPerDay = user.maxPostsPerDay;
    const canPostToday = await this.store.canPostToday(user.id, maxPerDay);

    return {
      todayCount,
      maxPerDay,
      canPostToday,
      remaining: Math.max(0, maxPerDay - todayCount),
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
    @CurrentUser() user: { id: string },
  ) {
    await this.store.getPostById(id, user.id);
    await this.store.deletePost(id);

    return { message: 'Post deleted successfully' };
  }
}
