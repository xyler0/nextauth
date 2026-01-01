import { Module } from '@nestjs/common';
import { XService } from './x.service';

@Module({
  providers: [XService],
  exports: [XService],
})
export class XModule {}