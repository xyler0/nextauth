# DEPLOYMENT QUIDE
- VPS with Docker installed
- Domain name pointing to server
- SSL certificate (Let's Encrypt recommended)

## Quick Deploy

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/x-poster.git
cd x-poster
```

### 2. Environment Configuration

```bash
# Create production .env
sudo nano .env
```

```env
# Database
DATABASE_USER=xposter_prod
DATABASE_PASSWORD=secure_password_here
DATABASE_NAME=xposter_prod

# JWT
JWT_SECRET=your_secure_jwt_secret_64_chars_min

# OpenAI
OPENAI_API_KEY=sk-...

# GitHub OAuth (production URLs)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=https://yourdomain.com/auth/github/callback

# Twitter OAuth (production URLs)
TWITTER_CONSUMER_KEY=...
TWITTER_CONSUMER_SECRET=...
TWITTER_CALLBACK_URL=https://yourdomain.com/auth/twitter/callback

# Settings
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
MAX_POSTS_PER_DAY=3
X_DRY_RUN=false
SCHEDULER_ENABLED=true
```

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in /etc/letsencrypt/live/yourdomain.com/
```

### 4. Update OAuth URLs

**GitHub:**
1. Go to https://github.com/settings/developers
2. Update callback URL: `https://yourdomain.com/auth/github/callback`

**Twitter:**
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Update callback URL: `https://yourdomain.com/auth/twitter/callback`

### 5. Deploy

```bash
# Build and start services
sudo docker-compose -f docker-compose.prod.yml up -d

# View logs
sudo docker-compose -f docker-compose.prod.yml logs -f

# Check health
curl https://yourdomain.com/health
```

## Maintenance

### Update Application

```bash
cd /var/www/x-poster
sudo git pull origin main
sudo docker-compose -f docker-compose.prod.yml pull
sudo docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

### Backup Database

```bash
# Create backup
sudo docker-compose exec postgres pg_dump -U xposter_prod xposter_prod > backup-$(date +%Y%m%d).sql

# Restore backup
sudo docker-compose exec -T postgres psql -U xposter_prod xposter_prod < backup-20240101.sql
```

### View Logs

```bash
# All services
sudo docker-compose -f docker-compose.prod.yml logs -f

# Specific service
sudo docker-compose -f docker-compose.prod.yml logs -f api
```

### Restart Services

```bash
sudo docker-compose -f docker-compose.prod.yml restart
```

## Monitoring

### Health Checks

```bash
# API health
curl https://yourdomain.com/health

# Database health
sudo docker-compose exec postgres pg_isready -U xposter_prod
```

### Resource Usage

```bash
# Container stats
sudo docker stats

# Disk usage
sudo docker system df
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo docker-compose -f docker-compose.prod.yml logs api

# Check environment
sudo docker-compose -f docker-compose.prod.yml config

# Restart specific service
sudo docker-compose -f docker-compose.prod.yml restart api
```

### Database Connection Issues

```bash
# Check database logs
sudo docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
sudo docker-compose exec api node -e "console.log('Testing...')"
```

### SSL Certificate Renewal

```bash
# Renew certificate
sudo certbot renew

# Reload nginx
sudo docker-compose -f docker-compose.prod.yml restart nginx
```

## Security Checklist

- [ ] Strong JWT_SECRET (64+ characters)
- [ ] Strong database password
- [ ] HTTPS enabled
- [ ] Firewall configured (UFW)
- [ ] SSH key authentication only
- [ ] Regular backups scheduled
- [ ] Fail2ban installed
- [ ] Docker security best practices
- [ ] Environment variables secured
- [ ] OAuth URLs use HTTPS

## Scaling

### Horizontal Scaling

```bash
# Scale API instances
sudo docker-compose -f docker-compose.prod.yml up -d --scale api=3
```

### Add Load Balancer

Update nginx.conf:

```nginx
upstream api {
  server api_1:3000;
  server api_2:3000;
  server api_3:3000;
}
```

## CI/CD Integration

The repository includes GitHub Actions workflows for:
- Automated testing on push/PR
- Docker image building
- Deployment to production

**Required GitHub Secrets:**
- `SSH_PRIVATE_KEY`
- `SERVER_HOST`
- `SERVER_USER`
- `SLACK_WEBHOOK_URL` (optional)