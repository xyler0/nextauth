export const corsConfig = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    process.env.BACKEND_URL || 'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

export function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return corsConfig.origin.includes(origin);
}