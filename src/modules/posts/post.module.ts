import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { ComposerModule } from '../composer/composer.module';
import { StoreModule } from '../store/store.module';
import { ConfigModule } from '@nestjs/config';
import { ToneModule } from '../tone/tone.module';
import { XModule } from '../x/x.module';


@Module({
  imports: [
    ComposerModule,
    ToneModule,
    StoreModule,
    XModule,
    ConfigModule,
  ],
  controllers: [PostsController],
})
export class PostsModule {}
