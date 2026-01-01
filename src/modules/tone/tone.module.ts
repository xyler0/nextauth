import { Module } from '@nestjs/common';
import { ToneService } from './tone.service';

@Module({
  providers: [ToneService],
  exports: [ToneService],
})
export class ToneModule {}