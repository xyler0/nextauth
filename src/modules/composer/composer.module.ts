import { Module } from '@nestjs/common';
import { ComposerService } from './composer.service';
import { ToneModule } from '../tone/tone.module';
import { XModule } from '../x/x.module';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [ToneModule, XModule, StoreModule],
  providers: [ComposerService],
  exports: [ComposerService],
})
export class ComposerModule {}