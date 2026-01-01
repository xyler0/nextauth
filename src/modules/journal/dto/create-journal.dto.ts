import { IsString, IsOptional, IsObject, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJournalDto {
  @ApiProperty({
    description: 'Journal entry content',
    example: 'Today I built a new feature for the X poster. It automatically detects GitHub commits and generates posts in my voice.',
    minLength: 50,
    maxLength: 10000,
  })
  @IsString()
  @MinLength(50, { message: 'Journal entry must be at least 50 characters' })
  @MaxLength(10000, { message: 'Journal entry cannot exceed 10000 characters' })
  content: string;

  @ApiPropertyOptional({
    description: 'Optional metadata (tags, mood, etc.)',
    example: { tags: ['coding', 'automation'], mood: 'productive' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}