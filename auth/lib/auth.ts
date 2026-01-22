import GitHub from "next-auth/providers/github";
import Twitter from "next-auth/providers/twitter";
import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma)
export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      
      // If URL has callbackUrl, use it
      if (url.includes('callbackUrl=')) {
        const params = new URL(url).searchParams;
        const callbackUrl = params.get('callbackUrl');
        if (callbackUrl) return callbackUrl;
      }

      // If relative URL, make absolute to frontend
      if (url.startsWith('/')) return `${frontendUrl}${url}`;
      
      // If same origin, redirect to frontend
      if (url.startsWith(baseUrl)) return frontendUrl;
      
      // If frontend URL, allow it
      if (url.startsWith(frontendUrl)) return url;
      
      // Default to frontend
      return frontendUrl;
    },
  },

  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;