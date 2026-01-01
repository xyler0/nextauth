import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { ComposerModule } from '../composer/composer.module';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [ComposerModule, StoreModule],
  controllers: [PostsController],
})
export class PostsModule {}