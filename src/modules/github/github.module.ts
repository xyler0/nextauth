import { Module } from '@nestjs/common';
import { GitHubService } from './github.service';
import { GithubController } from './github.controller';
import { GitHubFilter } from './github.filter';

@Module({
  controllers: [GithubController],
  providers: [GitHubService, GitHubFilter],
  exports: [GitHubService],
})
export class GitHubModule {}