import { Module } from '@nestjs/common';
import { ToneService } from './tone.service';
import { PatternModule } from '../pattern/pattern.module';

@Module({
  imports: [PatternModule],
  providers: [ToneService],
  exports: [ToneService],
})
export class ToneModule {}