import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
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

  async createEntry(dto: CreateJournalDto, userId: string): Promise<JournalResponseDto> {
    this.logger.log(`Creating journal entry for user ${userId}`);

    const entry = await this.prisma.journalEntry.create({
      data: {
        content: dto.content,
        metadata: dto.metadata ?? undefined,
        userId,
      },
    });

    this.logger.log(`Journal entry created: ${entry.id}`);

    return {
      id: entry.id,
      processed: false,
      createdAt: entry.createdAt,
    };
  }

  async processEntry(entryId: string, userId: string): Promise<string[]> {
    this.logger.log(`Processing journal entry: ${entryId}`);

    const entry = await this.prisma.journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new BadRequestException('Journal entry not found');
    }

    // Verify ownership
    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not own this journal entry');
    }

    if (entry.processed) {
      throw new BadRequestException('Journal entry already processed');
    }

    const segments = this.processor.process(entry.content);

    await this.prisma.journalEntry.update({
      where: { id: entryId },
      data: { processed: true },
    });

    this.logger.log(`Journal entry processed: ${entryId}`);
    return segments;
  }

  async getUserEntries(userId: string, limit = 50) {
    return this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        content: true,
        processed: true,
        createdAt: true,
      },
    });
  }

  async getUnprocessedEntries(userId: string): Promise<string[]> {
    const entries = await this.prisma.journalEntry.findMany({
      where: {
        processed: false,
        userId, 
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    return entries.map((e) => e.id);
  }
}