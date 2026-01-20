import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { XModule } from '../x/x.module';
import { GitHubModule } from '../github/github.module';

@Module({
  imports: [XModule, GitHubModule],
  controllers: [UserController],
})
export class UserModule {}