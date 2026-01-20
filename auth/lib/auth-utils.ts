import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }
  return user;
}

export async function getProviderAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    select: {
      provider: true,
      providerAccountId: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });
}