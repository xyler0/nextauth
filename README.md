# X Poster API

> Automated X/Twitter posting from GitHub commits and journal entries with AI-powered tone enforcement.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

## Features

- **Multi-Auth System** - Email/password, GitHub OAuth, Twitter OAuth
- **Intelligent Journal Processing** - AI-powered text scoring and extraction
- **GitHub Integration** - Auto-post on commits, PRs, releases
- **Tone Enforcement** - Consistent voice across all posts
- **Daily Limits & Stats** - Control posting frequency
- **Production Ready** - Health checks, logging, monitoring

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/x-poster.git
cd x-poster

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run start:dev
```

Visit `http://localhost:3000/api/docs` for interactive API documentation.

## Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

Services:
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Swagger Docs: `http://localhost:3000/api/docs`

## Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/xposter"

# JWT Authentication
JWT_SECRET="your-secure-secret-here"

# OpenAI (for tone enforcement)
OPENAI_API_KEY="sk-..."

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_CALLBACK_URL="http://localhost:3000/auth/github/callback"

# Twitter OAuth
TWITTER_CONSUMER_KEY="your-twitter-consumer-key"
TWITTER_CONSUMER_SECRET="your-twitter-consumer-secret"
TWITTER_CALLBACK_URL="http://localhost:3000/auth/twitter/callback"

# Application
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:3000"
MAX_POSTS_PER_DAY=3
```

### Optional Variables

```env
# X/Twitter (manual credentials - deprecated, use OAuth)
X_DRY_RUN=true
X_API_KEY=""
X_API_SECRET=""

# GitHub Webhooks
GITHUB_WEBHOOK_SECRET="your-webhook-secret"

# Monitoring
SCHEDULER_ENABLED=true
```

## API Documentation

### Authentication

#### Traditional Auth
```bash
# Signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongP@ss123","name":"John"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongP@ss123"}'
```

#### OAuth
```bash
# GitHub OAuth - Visit in browser
http://localhost:3000/auth/github

# Twitter OAuth - Visit in browser
http://localhost:3000/auth/twitter
```

### Journal Management

```bash
# Create journal entry
curl -X POST http://localhost:3000/journal \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"content":"Your journal entry..."}'

# Process and post
curl -X POST http://localhost:3000/journal/process-and-post \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"entryId":"ENTRY_ID"}'
```

### Account Management

```bash
# Link GitHub (visit in browser with JWT)
http://localhost:3000/user/link/github

# Get connections
curl http://localhost:3000/user/connections \
  -H "Authorization: Bearer YOUR_JWT"

# List repositories
curl http://localhost:3000/user/github/repositories \
  -H "Authorization: Bearer YOUR_JWT"

# Select repos to monitor
curl -X PUT http://localhost:3000/user/github/repositories \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"repos":["username/repo1","username/repo2"]}'
```

## Architecture

```
x-poster/
├── src/
│   ├── modules/
│   │   ├── auth/           # JWT + OAuth strategies
│   │   ├── journal/        # Journal processing
│   │   ├── github/         # GitHub webhooks
│   │   ├── posts/          # Post management
│   │   ├── tone/           # AI tone enforcement
│   │   ├── composer/       # Post orchestration
│   │   ├── x/              # Twitter integration
│   │   ├── store/          # Database operations
│   │   └── scheduler/      # Cron jobs
│   ├── common/             # Guards, decorators
│   ├── config/             # Configuration
│   └── database/           # Prisma client
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Migration history
├── test/                   # E2E and unit tests
└── docs/                   # Documentation
```

## Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🔒 Security Features

- JWT authentication with 7-day expiration
- bcrypt password hashing (10 rounds)
- GitHub webhook signature verification
- Rate limiting (10 req/min globally)
- Input validation on all DTOs
- Helmet security headers
- CORS with origin whitelist
- OAuth state management
- SQL injection protection (Prisma)

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost:3000/health

# Response
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" }
  }
}
```

### Logging

Logs include:
- Request/response times
- OAuth flows
- Post creation
- GitHub webhooks
- Error tracking

## GitHub Webhook Setup

1. Go to repository → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/webhooks/github`
3. Content type: `application/json`
4. Secret: Your `GITHUB_WEBHOOK_SECRET`
5. Select events: Push, Pull Request, Release
6. Save webhook

## OAuth Setup

### GitHub OAuth

1. Visit https://github.com/settings/developers
2. Create OAuth App
3. Set callback: `http://localhost:3000/auth/github/callback`
4. Copy Client ID and Secret to `.env`

### Twitter OAuth

1. Visit https://developer.twitter.com/en/portal/dashboard
2. Create app with OAuth 1.0a
3. Enable "Read and write" permissions
4. Set callback: `http://localhost:3000/auth/twitter/callback`
5. Copy Consumer Key and Secret to `.env`

**See [docs/OAUTH_SETUP.md](./docs/OAUTH_SETUP.md) for detailed instructions.**

## Deployment

### Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Scale API instances
docker-compose up -d --scale api=3
```

### Environment-Specific Configs

**Development:**
```env
NODE_ENV=development
X_DRY_RUN=true
SCHEDULER_ENABLED=false
```

**Production:**
```env
NODE_ENV=production
X_DRY_RUN=false
SCHEDULER_ENABLED=true
DATABASE_URL="postgresql://..."
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

### Development Workflow

```bash
# Install dependencies
npm install

# Run migrations
npx prisma migrate dev

# Start dev server
npm run start:dev

# Run tests
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format