import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(helmet());
  
  // CORS - allow frontend and Auth.js service
  app.enableCors({
    origin: [
      ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
      process.env.NEXTAUTH_URL || 'http://localhost:3002',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('X Poster API')
    .setDescription('Automated X posting from GitHub and Journal with tone enforcement')
    .setVersion('1.0')
    .addTag('user', 'User settings and profile')
    .addTag('journal', 'Journal entry management')
    .addTag('posts', 'Post creation and management')
    .addTag('webhooks', 'GitHub webhook receiver')
    .addTag('health', 'System health checks')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token from Auth.js (without "Bearer" prefix)',
      },
      'JWT',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Hub-Signature-256',
        in: 'header',
        description: 'GitHub webhook signature',
      },
      'X-Hub-Signature-256',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(` API running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();