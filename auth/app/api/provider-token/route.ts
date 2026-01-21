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
import { validateOrigin } from "@/lib/cors-config";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { allowed, remaining } = rateLimit(request, 30); // 30 requests per minute

  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60',
        },
      }
    );
  }

  const origin = request.headers.get('origin');

  if (!validateOrigin(origin)) {
    return NextResponse.json(
      { error: 'CORS: Origin not allowed' },
      { status: 403 }
    );
  }

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

    const response = NextResponse.json({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expires_at: account.expires_at,
      provider: account.provider,
    });
    response.headers.set('Access-Control-Allow-Origin', origin!);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  } catch (error) {
    logger.error('Error fetching provider token', error);
    const response = serverErrorResponse();
    response.headers.set('Access-Control-Allow-Origin', origin!);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  }
}