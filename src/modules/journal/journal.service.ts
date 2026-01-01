import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JournalProcessor } from './journal.processor';
import { CreateJournalDto } from './dto/create-journal.dto';
import { JournalResponseDto } from './dto/journal-response.dto';

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: JournalProcessor,
  ) {}

  async createEntry(dto: CreateJournalDto): Promise<JournalResponseDto> {
    this.logger.log('Creating journal entry');

    // Save journal entry
    const entry = await this.prisma.journalEntry.create({
      data: {
        content: dto.content,
        metadata: dto.metadata,
      },
    });

    this.logger.log(`Journal entry created: ${entry.id}`);

    return {
      id: entry.id,
      processed: false,
      createdAt: entry.createdAt,
    };
  }

  async processEntry(entryId: string): Promise<string[]> {
    this.logger.log(`Processing journal entry: ${entryId}`);

    // Fetch entry
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new BadRequestException('Journal entry not found');
    }

    if (entry.processed) {
      throw new BadRequestException('Journal entry already processed');
    }

    // Extract top 2 segments
    const segments = this.processor.process(entry.content);

    // Mark as processed
    await this.prisma.journalEntry.update({
      where: { id: entryId },
      data: { processed: true },
    });

    this.logger.log(`Journal entry processed: ${entryId}`);
    return segments;
  }

  async getUnprocessedEntries(): Promise<string[]> {
    const entries = await this.prisma.journalEntry.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    return entries.map((e) => e.id);
  }
}