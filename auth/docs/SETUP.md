# Auth Service Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- GitHub OAuth App
- Twitter OAuth App

## Installation

### 1. Clone and Install
```bash
git clone <repo>
cd auth-service
npm install
```

### 2. Database Setup
```bash
# Create database
createdb auth_db

# Run migrations
npx prisma migrate deploy
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/auth_db"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"

GITHUB_CLIENT_ID="<from GitHub OAuth app>"
GITHUB_CLIENT_SECRET="<from GitHub OAuth app>"

TWITTER_CLIENT_ID="<from Twitter Developer Portal>"
TWITTER_CLIENT_SECRET="<from Twitter Developer Portal>"

INTERNAL_API_KEY="<shared secret with backend>"
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"
```

### 4. OAuth Setup

#### GitHub OAuth
1. Go to https://github.com/settings/developers
2. Create new OAuth App
3. Set Homepage URL: `http://localhost:3002`
4. Set Callback URL: `http://localhost:3002/api/auth/callback/github`
5. Copy Client ID and Secret to `.env.local`

#### Twitter OAuth
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create new App
3. Set up OAuth 2.0
4. Add callback URL: `http://localhost:3002/api/auth/callback/twitter`
5. Request scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
6. Copy Client ID and Secret to `.env.local`

## Development

### Start Dev Server
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Check Database
```bash
npx prisma studio
```

## Production Deployment

### 1. Environment Setup
- Set `NODE_ENV=production`
- Use production database
- Enable HTTPS
- Set secure session cookies

### 2. Build
```bash
npm run build
npm start
```

### 3. Docker (Optional)
```bash
docker build -t auth-service .
docker run -p 3002:3002 auth-service
```

## Troubleshooting

### Issue: "Invalid redirect_uri"
- Check OAuth callback URLs match exactly
- Ensure no trailing slashes

### Issue: "Database connection failed"
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Run migrations: `npx prisma migrate deploy`

### Issue: "Session not persisting"
- Check NEXTAUTH_SECRET is set
- Verify cookies are enabled
- Check NEXTAUTH_URL matches your domain