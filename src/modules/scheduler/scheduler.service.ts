import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { JournalService } from '../journal/journal.service';
import { ComposerService } from '../composer/composer.service';
import { PostSource } from '../../generated/prisma/client';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly journal: JournalService,
    private readonly composer: ComposerService,
  ) {
    this.enabled = this.config.get<string>('SCHEDULER_ENABLED', 'true') === 'true';
    this.logger.log(`Scheduler ${this.enabled ? 'enabled' : 'disabled'}`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async processUnprocessedJournals() {
    if (!this.enabled) {
      return;
    }

    this.logger.log('Running daily journal processing');

    try {
      const entryIds = await this.journal.getUnprocessedEntries();
      this.logger.log(`Found ${entryIds.length} unprocessed entries`);

      for (const entryId of entryIds) {
        // Extract segments
        const segments = await this.journal.processEntry(entryId);
        this.logger.log(`Extracted ${segments.length} segments from ${entryId}`);

        // Compose and post
        const results = await this.composer.composeMany(
          segments,
          PostSource.JOURNAL,
          { journalEntryId: entryId },
        );

        results.forEach((r, i) => {
          this.logger.log(`Segment ${i + 1}: ${r.posted ? 'Posted' : `Skipped (${r.reason})`}`);
        });

        // Add delay between entries
        await this.sleep(60000); // 1 minute
      }

      this.logger.log('Daily journal processing complete');
    } catch (error) {
      this.logger.error('Daily journal processing failed', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}