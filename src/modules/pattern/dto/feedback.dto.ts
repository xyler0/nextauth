import { IsString, IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitFeedbackDto {
  @ApiProperty({ description: 'Original text before tone enforcement' })
  @IsString()
  originalText: string;

  @ApiProperty({ description: 'AI-generated text' })
  @IsString()
  generatedText: string;

  @ApiPropertyOptional({ description: 'Your edited version (if you changed it)' })
  @IsString()
  @IsOptional()
  editedText?: string;

  @ApiProperty({ description: 'Rating (1-5 stars)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Optional feedback comment' })
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiProperty({ description: 'Did you accept this post?' })
  @IsBoolean()
  accepted: boolean;
}