import { Module } from '@nestjs/common';
import { ComposerService } from './composer.service';
import { ToneModule } from '../tone/tone.module';
import { XModule } from '../x/x.module';
import { StoreModule } from '../store/store.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ToneModule, XModule, StoreModule, ConfigModule],
  providers: [ComposerService],
  exports: [ComposerService],
})
export class ComposerModule {}