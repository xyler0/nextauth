import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsObject,
} from 'class-validator';
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

class PullRequestDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  html_url: string;

  @ApiProperty()
  @IsString()
  state: string;
}

class ReleaseDto {
  @ApiProperty()
  @IsString()
  tag_name: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  html_url: string;
}

export class GitHubWebhookDto {
  @ApiProperty({
    description: 'Webhook event action',
    example: 'opened',
  })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Repository information' })
  @ValidateNested()
  @Type(() => RepositoryDto)
  repository: RepositoryDto;

  @ApiPropertyOptional({
    description: 'Array of commits (push events)',
    type: [CommitDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitDto)
  commits?: CommitDto[];

  @ApiPropertyOptional({ description: 'Pull request payload' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PullRequestDto)
  pull_request?: PullRequestDto;

  @ApiPropertyOptional({ description: 'Release payload' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReleaseDto)
  release?: ReleaseDto;
}
