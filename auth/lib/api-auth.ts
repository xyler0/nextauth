import { NextRequest, NextResponse } from "next/server";

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  return apiKey === process.env.INTERNAL_API_KEY;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized - Invalid API key' },
    { status: 401 }
  );
}

export function badRequestResponse(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}

export function notFoundResponse(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 404 }
  );
}

export function serverErrorResponse(message: string = 'Internal server error') {
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}