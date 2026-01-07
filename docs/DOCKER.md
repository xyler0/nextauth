# Docker Deployment Guide

## Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your credentials
nano .env

# 3. Start services
docker-compose up -d

# 4. View logs
docker-compose logs -f api

# 5. Stop services
docker-compose down
```

## Services

### PostgreSQL
- **Image**: postgres:14-alpine
- **Port**: 5432
- **Database**: xposter
- **User**: xposter
- **Data**: Persisted in Docker volume

### API
- **Port**: 3000
- **Health Check**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/api/docs

## Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# API only
docker-compose logs -f api

# Database only
docker-compose logs -f postgres
```

### Restart Services
```bash
docker-compose restart
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### Run Migrations
```bash
docker-compose exec api npx prisma migrate deploy
```

### Access Database
```bash
docker-compose exec postgres psql -U xposter -d xposter
```

### Scale API Instances
```bash
docker-compose up -d --scale api=3
```

## Environment Variables

Required in `.env`:

```env
# JWT
JWT_SECRET=your-secret-here

# OpenAI
OPENAI_API_KEY=sk-...

# GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# Twitter OAuth
TWITTER_CONSUMER_KEY=...
TWITTER_CONSUMER_SECRET=...
TWITTER_CALLBACK_URL=http://localhost:3000/auth/twitter/callback

# Optional
FRONTEND_URL=http://localhost:3000
MAX_POSTS_PER_DAY=3
X_DRY_RUN=false
SCHEDULER_ENABLED=true
```

## Volumes

### postgres_data
Persists PostgreSQL database files.

**Backup:**
```bash
docker-compose exec postgres pg_dump -U xposter xposter > backup.sql
```

**Restore:**
```bash
docker-compose exec -T postgres psql -U xposter xposter < backup.sql
```

**Delete (WARNING):**
```bash
docker-compose down -v
```

## Health Checks

### API Health
```bash
curl http://localhost:3000/health
```

### Database Health
```bash
docker-compose exec postgres pg_isready -U xposter
```

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs api
```

**Common issues:**
- Missing environment variables
- Database not ready (increase start_period)
- Port already in use

### Database Connection Failed

**Check database is healthy:**
```bash
docker-compose ps
```

**Manual connection test:**
```bash
docker-compose exec api node -e "const { PrismaClient } = require('@prisma/client'); new PrismaClient().\$connect().then(() => console.log('Connected')).catch(console.error)"
```

### API Not Responding

**Check container status:**
```bash
docker-compose ps
```

**Restart API:**
```bash
docker-compose restart api
```

### Migrations Not Running

**Run manually:**
```bash
docker-compose exec api npx prisma migrate deploy
```

## Production Deployment

### Use Production Compose File

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    # ... same as docker-compose.yml
    environment:
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}  # Use secrets

  api:
    # ... same as docker-compose.yml
    image: your-registry/xposter-api:latest
    environment:
      NODE_ENV: production
      # Use environment-specific values

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
```

### Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## CI/CD Integration

### Build Image
```bash
docker build -t xposter-api:latest .
```

### Push to Registry
```bash
docker tag xposter-api:latest your-registry/xposter-api:latest
docker push your-registry/xposter-api:latest
```

### Pull and Deploy
```bash
docker pull your-registry/xposter-api:latest
docker-compose up -d