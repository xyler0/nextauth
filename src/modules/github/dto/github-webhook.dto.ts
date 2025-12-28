import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CommitDto {
  @ApiProperty({ description: 'Commit message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Commit author username' })
  @IsString()
  author: string;
}

class RepositoryDto {
  @ApiProperty({ description: 'Repository name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Full repository name (owner/repo)' })
  @IsString()
  full_name: string;
}

export class GitHubWebhookDto {
  @ApiProperty({ 
    description: 'Webhook event action',
    example: 'opened' 
  })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Repository information' })
  @ValidateNested()
  @Type(() => RepositoryDto)
  repository: RepositoryDto;

  @ApiPropertyOptional({ 
    description: 'Array of commits (for push events)',
    type: [CommitDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitDto)
  @IsOptional()
  commits?: CommitDto[];

  @ApiPropertyOptional({ description: 'Pull request information' })
  @IsOptional()
  pull_request?: any;

  @ApiPropertyOptional({ description: 'Release information' })
  @IsOptional()
  release?: any;
}