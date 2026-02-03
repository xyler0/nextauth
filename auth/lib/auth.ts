import GitHub from "next-auth/providers/github";
import Twitter from "next-auth/providers/twitter";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo admin:repo_hook',
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "tweet.read tweet.write users.read offline.access",
          response_type: "code",
        },
      },
      profile(profile) {
        return {
          id: profile.data.id,
          name: profile.data.name,
          email: profile.data.email || `${profile.data.username}@twitter.placeholder`,
          image: profile.data.profile_image_url,
        };
      },
    }),

    // Email/Password Provider
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { accounts: true },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Store username in Account table
      if (account && profile) {
        const username = 
          account.provider === 'github' ? (profile as any).login :
          account.provider === 'twitter' ? (profile as any).data?.username :
          null;

        if (username) {
          await prisma.account.updateMany({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
            data: { username },
          });
        }
      }
      return true;
    },

    async jwt({ token, user, account, profile, trigger }) {
      if (user) {
        token.id = user.id;
      }
      
      if (account) {
        token.provider = account.provider;
        
        // Store username from OAuth profile
        if (profile) {
          if (account.provider === 'github') {
            token.username = (profile as any).login;
          } else if (account.provider === 'twitter') {
            token.username = (profile as any).data?.username;
          }
        }
      }

      // Handle session updates
      if (trigger === "update") {
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
        });
        if (user) {
          token.name = user.name;
          token.email = user.email;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.email = token.email ?? "";
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;