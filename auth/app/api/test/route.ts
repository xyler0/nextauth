import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'auth-service',
    version: '1.0.0',
    endpoints: {
      providers: '/api/auth/providers',
      session: '/api/session',
      providerToken: '/api/provider-token?userId=&provider=',
      providerLinked: '/api/provider-linked?userId=&provider=',
    },
  });
}