import { IsArray, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGitHubSettingsDto {
  @ApiPropertyOptional({ description: 'GitHub username' })
  @IsString()
  @IsOptional()
  githubUsername?: string;

  @ApiPropertyOptional({
    description: 'List of repositories to monitor',
    example: ['user/repo1', 'user/repo2'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  githubRepos?: string[];
}