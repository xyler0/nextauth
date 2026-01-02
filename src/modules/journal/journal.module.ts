import { Module } from '@nestjs/common';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';
import { JournalProcessor } from './journal.processor';
import { JournalScorer } from './journal.scorer';
import { ComposerModule } from '../composer/composer.module';

@Module({
  imports: [ComposerModule],
  controllers: [JournalController],
  providers: [JournalService, JournalProcessor, JournalScorer],
  exports: [JournalService],
})
export class JournalModule {}