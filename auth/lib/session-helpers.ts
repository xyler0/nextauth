import { auth } from "@/auth";
import { prisma } from "./prisma";

export async function refreshSession() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  // Update user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return user;
}

export async function isSessionExpired(expiresAt: Date): Promise<boolean> {
  return new Date() > expiresAt;
}

export async function getSessionTimeRemaining(expiresAt: Date): Promise<number> {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  return Math.max(0, expires - now);
}