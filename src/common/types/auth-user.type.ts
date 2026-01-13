export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  maxPostsPerDay: number;
  timezone: string;
};
