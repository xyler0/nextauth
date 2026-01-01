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
import { CreateJournalDto } from './dto/create-journal.dto';
import { JournalResponseDto } from './dto/journal-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('journal')
@Controller('journal')
@ApiBearerAuth()
export class JournalController {
  private readonly logger = new Logger(JournalController.name);

  constructor(private readonly journalService: JournalService) {}

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
    @CurrentUser() user: any,
  ): Promise<JournalResponseDto> {
    this.logger.log(`Received journal entry from user ${user.id}`);
    return this.journalService.createEntry(dto, user.id);
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process journal entry',
    description: 'Extract and generate posts from a journal entry',
  })
  @ApiResponse({
    status: 200,
    description: 'Journal processed successfully',
  })
  async processEntry(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Processing journal entry: ${id} for user ${user.id}`);
    const segments = await this.journalService.processEntry(id, user.id);
    return { segments };
  }

  @Get()
  @ApiOperation({ summary: 'Get user journal entries' })
  @ApiResponse({ status: 200, description: 'List of journal entries' })
  async getUserEntries(@CurrentUser() user: any) {
    return this.journalService.getUserEntries(user.id);
  }
}