// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import passport from 'passport';   
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // IMPORTANT: Apply validation pipe BEFORE any guards
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 3600000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    }),
  );

  // Initialize Passport
  app.use(passport.initialize());
  //app.use(passport.session());

  app.use(helmet());
  
  // CORS - allow frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
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
    .addTag('auth', 'Authentication endpoints')
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
        description: 'Enter JWT token (without "Bearer" prefix)',
      },
      'JWT', // This name must match the one used in @ApiBearerAuth()
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
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep the token even after page refresh
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application listening on port ${port}`);
  console.log(`API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();