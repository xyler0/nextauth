import { authConfig } from "./auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import type { NextAuthConfig } from "next-auth";

export const authServerConfig = {
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  
  events: {
    async signIn({ user, account }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
    },
    async linkAccount({ user, account }) {
      console.log(`Account linked: ${account.provider} for user ${user.email}`);
    },
  },
} satisfies NextAuthConfig;