import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GitHubModule } from './modules/github/github.module';
import appConfig from './config/app.config';
import githubConfig from './config/github.config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, githubConfig],
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    GitHubModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
     provide: APP_GUARD,
     useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}