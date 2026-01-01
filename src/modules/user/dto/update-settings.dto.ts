import { IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Maximum posts per day', minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxPostsPerDay?: number;

  @ApiPropertyOptional({ description: 'User timezone', example: 'America/New_York' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: 'User name' })
  @IsString()
  @IsOptional()
  name?: string;
}
