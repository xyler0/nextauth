"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function unlinkProvider(provider: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  // Don't allow unlinking if it's the only provider
  const accountCount = await prisma.account.count({
    where: { userId: session.user.id },
  });

  if (accountCount <= 1) {
    throw new Error('Cannot unlink your only authentication method');
  }

  // Delete the account
  await prisma.account.deleteMany({
    where: {
      userId: session.user.id,
      provider,
    },
  });

  revalidatePath('/settings');
  
  return { success: true };
}