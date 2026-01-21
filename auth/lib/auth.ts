import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import GitHub from "next-auth/providers/github";
import Twitter from "next-auth/providers/twitter";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
    
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  // ADD THIS - Critical for production
  useSecureCookies: process.env.NODE_ENV === 'production',
  
  cookies: {
    pkceCodeVerifier: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-authjs.pkce.code_verifier' 
        : 'authjs.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900, // 15 minutes
      },
    },
    state: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.state'
        : 'authjs.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900,
      },
    },
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      
      if (account) {
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
      }

      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });
        
        if (dbUser) {
          token.email = dbUser.email;
          token.name = dbUser.name;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      const frontendUrl = process.env.FRONTEND_URL || baseUrl;
      return frontendUrl;
    },
  },

  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;