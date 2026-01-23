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
    // We're now the frontend, so redirect to /dashboard after auth
    if (url.startsWith(baseUrl)) {
      return `${baseUrl}/dashboard`;
    }
    
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    
    // Default to dashboard
    return `${baseUrl}/dashboard`;
  },
  },

  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;