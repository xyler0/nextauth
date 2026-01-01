import { Module } from '@nestjs/common';
import { GitHubService } from './github.service';
import { GitHubController } from './github.controller';
import { GitHubFilter } from './github.filter';
import { ComposerModule } from '../composer/composer.module';

@Module({
  imports: [ComposerModule],
  controllers: [GitHubController],
  providers: [GitHubService, GitHubFilter],
  exports: [GitHubService],
})
export class GitHubModule {}