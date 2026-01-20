import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateApiKey,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
} from "@/lib/api-auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const provider = searchParams.get('provider');

  if (!userId || !provider) {
    return badRequestResponse('Missing userId or provider');
  }

  try {
    const count = await prisma.account.count({
      where: {
        userId,
        provider,
      },
    });

    return NextResponse.json({
      linked: count > 0,
      provider,
      userId,
    });
  } catch (error) {
  logger.error('Error fetching provider token', error);
  return serverErrorResponse();
  }
}