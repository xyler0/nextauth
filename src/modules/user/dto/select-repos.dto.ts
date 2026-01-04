import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectReposDto {
  @ApiProperty({
    description: 'List of repository full names to monitor',
    example: ['username/repo1', 'username/repo2'],
  })
  @IsArray()
  @IsString({ each: true })
  repos: string[];
}