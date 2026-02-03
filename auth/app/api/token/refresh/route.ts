import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { refreshTwitterToken } from "@/lib/token-refresh";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has Twitter OAuth and needs token refresh
    const twitterAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'twitter',
      },
    });

    if (twitterAccount) {
      const now = Math.floor(Date.now() / 1000);
      
      // Refresh Twitter token if expired
      if (twitterAccount.expires_at && twitterAccount.expires_at <= now) {
        try {
          await refreshTwitterToken(session.user.id, 'twitter');
        } catch (error) {
          console.error('Failed to refresh Twitter token:', error);
          // Continue anyway - user might have other auth methods
        }
      }
    }

    // Generate new JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    
    const token = await new SignJWT({
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    return NextResponse.json({
      accessToken: token,
      expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}