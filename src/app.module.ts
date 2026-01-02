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
import { HealthModule } from './health/health.module';
import { validationSchema } from './config/validation.schema';
import { DatabaseModule } from './database/database.module';
import { JournalModule } from './modules/journal/journal.module';
import { XModule } from './modules/x/x.module';
import { ComposerModule } from './modules/composer/composer.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PostsModule } from './modules/posts/post.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, githubConfig],
      envFilePath: ['.env'],
      validationSchema,
      validationOptions: {
        abortEarly: true, // Stop on first error
      },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    DatabaseModule,
 //   GitHubModule,
    HealthModule,
    JournalModule,
    XModule,
    ComposerModule,
    SchedulerModule,
    AuthModule,
    PostsModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
     provide: APP_GUARD,
     useClass: ThrottlerGuard,
    },
    {
     provide: APP_GUARD,
     useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}