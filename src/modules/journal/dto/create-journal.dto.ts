import {
  IsString,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Json } from 'src/common/types/journal';

export class CreateJournalDto {
  @ApiProperty({
    minLength: 50,
    maxLength: 10000,
    example:
      'Today I built a new feature for the X poster. It automatically detects GitHub commits and generates posts in my voice.',
  })
  @IsString()
  @MinLength(50)
  @MaxLength(10000)
  content: string;

  @ApiPropertyOptional({
    example: { tags: ['coding', 'automation'], mood: 'productive' },
  })
  @IsOptional()
  @IsObject()
   metadata?: Json;
}