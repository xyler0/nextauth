import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateApiKey,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  // Validate API key
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const provider = searchParams.get('provider');

  // Validate parameters
  if (!userId || !provider) {
    return badRequestResponse('Missing userId or provider');
  }

  try {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider,
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
        provider: true,
      },
    });

    if (!account) {
      return notFoundResponse('Provider account not found');
    }

    return NextResponse.json({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expires_at: account.expires_at,
      provider: account.provider,
    });
  } catch (error) {
    logger.error('Error fetching provider token', error);
    return serverErrorResponse();
    }
}