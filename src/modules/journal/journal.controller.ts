import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
import { JournalService } from './journal.service';
import { ComposerService } from '../composer/composer.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { JournalResponseDto } from './dto/journal-response.dto';
import { ProcessAndPostDto } from './dto/process-and-post.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PostSource } from '../../generated/prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';

@ApiTags('journal')
@ApiBearerAuth()
@Controller('journal')
export class JournalController {
  private readonly logger = new Logger(JournalController.name);

  constructor(
    private readonly journalService: JournalService,
    private readonly composer: ComposerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create journal entry',
    description: 'Submit a journal entry for processing and post generation',
  })
  @ApiResponse({
    status: 201,
    description: 'Journal entry created successfully',
    type: JournalResponseDto,
  })
  async createEntry(
    @Body() dto: CreateJournalDto,
    @CurrentUser() user: AuthUser,
  ): Promise<JournalResponseDto> {
    this.logger.log(`Received journal entry from user ${user.id}`);
    return this.journalService.createEntry(dto, user.id);
  }

  @Post('process-and-post')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process journal entry and post to X',
    description: 'Extract segments, apply tone, and post to X in one operation',
  })
  async processAndPost(
    @Body() dto: ProcessAndPostDto,
    @CurrentUser() user: AuthUser,
  ) {
    this.logger.log(`Processing journal: ${dto.entryId}`);

    const segments = await this.journalService.processEntry(
      dto.entryId,
      user.id,
    );

    const results = await this.composer.composeMany(
      segments,
      PostSource.JOURNAL,
      user.id,
      user.maxPostsPerDay,
      { journalEntryId: dto.entryId },
    );

    return {
      processed: true,
      entryId: dto.entryId,
      results,
    };
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process journal entry (extract only)',
  })
  async processEntry(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    this.logger.log(`Processing journal ${id} for user ${user.id}`);
    const segments = await this.journalService.processEntry(id, user.id);
    return { segments };
  }

  @Get()
  @ApiOperation({ summary: 'Get user journal entries' })
  async getUserEntries(@CurrentUser() user: AuthUser) {
    return this.journalService.getUserEntries(user.id);
  }
}
