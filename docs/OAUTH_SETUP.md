# OAuth Setup Guide

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in details:
   - **Application name**: X Poster (or your app name)
   - **Homepage URL**: `http://localhost:3000` (dev) or your domain
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
4. Click "Register application"
5. Copy **Client ID** and **Client Secret**

### 2. Add to .env

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

### 3. Test the Flow

**Signup/Login via GitHub:**
```
Visit: http://localhost:3000/auth/github
```

**Link GitHub to existing account:**
```
Visit: http://localhost:3000/user/link/github
(Must be authenticated with JWT)
```

---

## Twitter OAuth Setup

### 1. Create Twitter App

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new project and app
3. Go to app settings → "User authentication settings"
4. Configure OAuth:
   - **App permissions**: Read and write
   - **Type of App**: Web App
   - **Callback URL**: `http://localhost:3000/auth/twitter/callback`
   - **Website URL**: `http://localhost:3000`
5. Save and copy:
   - **API Key** (Consumer Key)
   - **API Key Secret** (Consumer Secret)

### 2. Add to .env

```env
TWITTER_CONSUMER_KEY=your_consumer_key
TWITTER_CONSUMER_SECRET=your_consumer_secret
TWITTER_CALLBACK_URL=http://localhost:3000/auth/twitter/callback
```

### 3. Important: Request Email Permission

Twitter doesn't provide email by default. You must:
1. Go to app settings
2. Enable "Request email from users"
3. Provide explanation for why you need email

### 4. Test the Flow

**Signup/Login via Twitter:**
```
Visit: http://localhost:3000/auth/twitter
```

**Link Twitter to existing account:**
```
Visit: http://localhost:3000/user/link/twitter
(Must be authenticated with JWT)
```

---

## OAuth Flow Diagram

### Signup Flow
```
User → /auth/github → GitHub → /auth/github/callback → JWT Token
```

### Account Linking Flow
```
Authenticated User → /user/link/github → GitHub → /user/link/github/callback → Settings Page
```

---

## Frontend Integration

### 1. Signup with OAuth

```typescript
// Redirect to OAuth provider
window.location.href = 'http://localhost:3000/auth/github';

// Handle callback
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const provider = urlParams.get('provider');

if (token) {
  localStorage.setItem('jwt', token);
  // Redirect to dashboard
}
```

### 2. Link Account

```typescript
// From authenticated page
async function linkGitHub() {
  // Open popup or redirect
  window.location.href = 'http://localhost:3000/user/link/github';
}

// On settings page
const urlParams = new URLSearchParams(window.location.search);
const linked = urlParams.get('linked');
const success = urlParams.get('success');

if (success === 'true') {
  showToast(`${linked} account linked successfully!`);
}
```

### 3. Check Connection Status

```typescript
const response = await fetch('http://localhost:3000/user/connections', {
  headers: {
    'Authorization': `Bearer ${jwt}`,
  },
});

const data = await response.json();
// {
//   github: { linked: true, username: 'johndoe' },
//   twitter: { linked: true, username: '@johndoe' }
// }
```

### 4. Unlink Account

```typescript
async function unlinkGitHub() {
  await fetch('http://localhost:3000/user/link/github', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${jwt}`,
    },
  });
}
```

---

## Security Considerations

1. **Use HTTPS in production** - OAuth tokens must be encrypted in transit
2. **Validate callback URLs** - Ensure callbacks match registered URLs
3. **Store tokens securely** - Database encryption for OAuth tokens
4. **Token refresh** - Implement token refresh if provider supports it
5. **Scope limitation** - Request minimal required permissions

---

## Troubleshooting

### "Email not provided by GitHub"
- GitHub account must have verified email
- Email must be public or app must request email scope

### "Invalid redirect_uri"
- Callback URL in .env must exactly match OAuth app settings
- Check for trailing slashes

### "Token expired"
- User needs to re-authenticate
- Implement automatic re-linking flow

### "X/Twitter email permission denied"
- User must enable email sharing in Twitter settings
- Or create account with email/password first, then link Twitter

---

## Production Checklist

- [ ] Register OAuth apps with production URLs
- [ ] Update callback URLs to production domain
- [ ] Enable HTTPS
- [ ] Set secure cookie settings
- [ ] Implement CSRF protection
- [ ] Add rate limiting on OAuth endpoints
- [ ] Monitor OAuth failures
- [ ] Implement token refresh (if supported)
- [ ] Add user consent screens
- [ ] Test account unlinking
```

```markdown
// docs/API_ENDPOINTS.md - Update with OAuth endpoints
# API Endpoints

## Authentication

### Traditional Auth
- `POST /auth/signup` - Create account with email/password
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout (client discards JWT)

### OAuth Authentication
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - GitHub OAuth callback
- `GET /auth/twitter` - Initiate Twitter OAuth
- `GET /auth/twitter/callback` - Twitter OAuth callback

## User Management

### Profile
- `GET /user/profile` - Get user profile
- `PUT /user/settings` - Update user settings

### OAuth Account Linking
- `GET /user/link/github` - Link GitHub account
- `GET /user/link/github/callback` - GitHub link callback
- `DELETE /user/link/github` - Unlink GitHub account
- `GET /user/link/twitter` - Link Twitter account
- `GET /user/link/twitter/callback` - Twitter link callback
- `DELETE /user/link/twitter` - Unlink Twitter account
- `GET /user/connections` - Get linked account status

### GitHub Integration
- `GET /user/github/repositories` - List user's GitHub repos
- `PUT /user/github/repositories` - Select repos to monitor
- `GET /user/github/verify` - Verify GitHub connection

### X/Twitter Integration
- `GET /user/x-credentials/verify` - Verify X connection

## Journal
- `POST /journal` - Create journal entry
- `GET /journal` - List user entries
- `POST /journal/:id/process` - Extract segments only
- `POST /journal/process-and-post` - Extract and post

## Posts
- `POST /posts/manual` - Create manual post
- `GET /posts` - List user posts
- `GET /posts/stats` - Get posting statistics
- `DELETE /posts/:id` - Delete post

## Webhooks
- `POST /webhooks/github` - GitHub webhook receiver (signature verified)

## Health
- `GET /` - API info
- `GET /health` - Health check