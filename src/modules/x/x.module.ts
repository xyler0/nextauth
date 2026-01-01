import { Module } from '@nestjs/common';
import { XService } from './x.service';

@Module({
  providers: [XService]
})
export class XModule {}
