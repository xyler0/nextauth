import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class CommitDto {
  @IsString()
  message: string;

  @IsString()
  author: string;
}

class RepositoryDto {
  @IsString()
  name: string;

  @IsString()
  full_name: string;
}

export class GitHubWebhookDto {
  @IsString()
  action: string;

  @ValidateNested()
  @Type(() => RepositoryDto)
  repository: RepositoryDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitDto)
  @IsOptional()
  commits?: CommitDto[];

  @IsOptional()
  pull_request?: any;

  @IsOptional()
  release?: any;
}