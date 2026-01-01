import { Module } from '@nestjs/common';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';
import { JournalProcessor } from './journal.processor';
import { JournalScorer } from './journal.scorer';

@Module({
  controllers: [JournalController],
  providers: [JournalService, JournalProcessor, JournalScorer],
  exports: [JournalService],
})
export class JournalModule {}