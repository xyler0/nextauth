"use server";

import { prisma } from "./prisma";

export async function refreshTwitterToken(userId: string, provider: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider },
  });

  if (!account?.refresh_token) {
    throw new Error('No refresh token available');
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && account.expires_at > now) {
    return account.access_token; // Still valid
  }

  // Refresh the token
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();

  // Update token in database
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      refresh_token: data.refresh_token || account.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    },
  });

  return data.access_token;
}