# Auth Service API Documentation

## Base URL
`http://localhost:3002`

## Authentication

### Get OAuth Providers
```http
GET /api/auth/providers
```

**Response:**
```json
{
  "github": {
    "id": "github",
    "name": "GitHub",
    "signinUrl": "http://localhost:3002/api/auth/signin/github"
  },
  "twitter": {
    "id": "twitter",
    "name": "Twitter",
    "signinUrl": "http://localhost:3002/api/auth/signin/twitter"
  }
}
```

### Sign In
```http
GET /api/auth/signin/[provider]
```

Redirects to OAuth provider.

### Get Session
```http
GET /api/session
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "expires": "2026-02-20T00:00:00.000Z"
}
```

## Internal API (NestJS Integration)

### Get Provider Token
```http
GET /api/provider-token?userId={userId}&provider={provider}
Headers:
  x-api-key: {INTERNAL_API_KEY}
```

**Response:**
```json
{
  "access_token": "gho_xxxxx",
  "refresh_token": "ghr_xxxxx",
  "expires_at": 1234567890,
  "provider": "github"
}
```

### Check Provider Linked
```http
GET /api/provider-linked?userId={userId}&provider={provider}
Headers:
  x-api-key: {INTERNAL_API_KEY}
```

**Response:**
```json
{
  "linked": true,
  "provider": "github",
  "userId": "user_123"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized - Invalid API key"
}
```

### 404 Not Found
```json
{
  "error": "Provider account not found"
}
```

### 429 Rate Limit
```json
{
  "error": "Rate limit exceeded"
}
```