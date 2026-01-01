import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { JournalModule } from '../journal/journal.module';
import { ComposerModule } from '../composer/composer.module';

@Module({
  imports: [JournalModule, ComposerModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}