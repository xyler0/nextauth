import { Module } from '@nestjs/common';
import { PatternController } from './pattern.controller';
import { PatternService } from './pattern.service';
import { PatternAnalyzerService } from './pattern-analyzer.service';

@Module({
  controllers: [PatternController],
  providers: [PatternService, PatternAnalyzerService],
  exports: [PatternService],
})
export class PatternModule {}