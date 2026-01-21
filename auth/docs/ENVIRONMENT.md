# Environment Variables

## Required Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Example: `postgresql://postgres:password@localhost:5432/auth_db`

### Auth.js
- `NEXTAUTH_URL` - Full URL of auth service
  - Development: `http://localhost:3002`
  - Production: `https://auth.yourdomain.com`
  
- `NEXTAUTH_SECRET` - Random secret for JWT signing
  - Generate: `openssl rand -base64 32`
  - Must be same across deployments

### GitHub OAuth
- `GITHUB_CLIENT_ID` - GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth App Secret

### Twitter OAuth
- `TWITTER_CLIENT_ID` - Twitter OAuth 2.0 Client ID
- `TWITTER_CLIENT_SECRET` - Twitter OAuth 2.0 Secret

### Internal API
- `INTERNAL_API_KEY` - Shared secret with backend
  - Must match backend's INTERNAL_API_KEY
  - Keep secret, never commit

### Integration URLs
- `BACKEND_URL` - NestJS backend URL
  - Development: `http://localhost:3000`
  
- `FRONTEND_URL` - Vite frontend URL
  - Development: `http://localhost:3001`

## Optional Variables

- `NODE_ENV` - Environment mode
  - Values: `development`, `production`, `test`
  - Default: `development`