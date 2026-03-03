import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from './lib/rate-limit';

/** CORS allowlist (P0 Security 3.3). Env CORS_ORIGINS = comma-separated; empty = same-origin only. */
function getCorsAllowedOrigins(): string[] {
  const env = process.env.CORS_ORIGINS;
  if (!env) return [];
  return env.split(',').map((o) => o.trim()).filter(Boolean);
}

/** Generate a short request-id (P0 Security 6.1). */
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!path.startsWith('/api')) {
    return NextResponse.next();
  }

  const requestId = request.headers.get('x-request-id') || generateRequestId();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const origin = request.headers.get('origin');
  const allowed = getCorsAllowedOrigins();
  const corsHeaders: Record<string, string> = {};
  if (origin && allowed.length > 0 && allowed.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
    corsHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Idempotency-Key, X-Request-Id';
    corsHeaders['Access-Control-Max-Age'] = '86400';
  }

  if (request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204, headers: corsHeaders });
    res.headers.set('X-Request-Id', requestId);
    return res;
  }

  let limit: number;
  let pathLabel: string;

  if (path.startsWith('/api/v1/auth/')) {
    limit = RATE_LIMITS.AUTH_PER_MIN;
    pathLabel = 'auth';
  } else if (path.startsWith('/api/v1/contact')) {
    limit = RATE_LIMITS.CONTACT_PER_MIN;
    pathLabel = 'contact';
  } else {
    limit = RATE_LIMITS.API_PER_MIN;
    pathLabel = 'api';
  }

  const retryAfter = checkRateLimit(request, limit, pathLabel);
  if (retryAfter !== null) {
    return new NextResponse(
      JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-Request-Id': requestId,
          ...corsHeaders,
        },
      }
    );
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('X-Request-Id', requestId);
  Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
