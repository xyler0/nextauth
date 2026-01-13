export interface OAuthUser {
  id: string;
  email: string;
  provider: 'github' | 'twitter';
}
