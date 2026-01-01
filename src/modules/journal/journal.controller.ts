import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JournalService } from './journal.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { JournalResponseDto } from './dto/journal-response.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('journal')
@Controller('journal')
@UseGuards(ApiKeyGuard)
@ApiSecurity('X-API-Key')
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
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing API key',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid journal content',
  })
  async createEntry(
    @Body() dto: CreateJournalDto,
  ): Promise<JournalResponseDto> {
    this.logger.log('Received journal entry');
    return this.journalService.createEntry(dto);
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
    schema: {
      example: {
        segments: [
          'Today I built a new feature for automated posting',
          'The system now filters GitHub commits intelligently',
        ],
      },
    },
  })
  async processEntry(@Param('id') id: string) {
    this.logger.log(`Processing journal entry: ${id}`);
    const segments = await this.journalService.processEntry(id);
    return { segments };
  }
}