import { NextResponse } from 'next/server';

/**
 * Custom API Error class for consistent error handling
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * API Response interface for consistent response format
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
  details?: unknown;
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string, 
  status: number = 500, 
  code?: string, 
  details?: unknown
): NextResponse {
  const response: ApiResponse = {
    error: message,
  };
  
  if (code) {
    response.code = code;
  }
  
  if (details) {
    response.details = details;
  }
  
  return NextResponse.json(response, { status });
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle custom ApiError
  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode, error.code);
  }

  // Handle validation errors
  if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
    return errorResponse('Invalid request data', 400, 'VALIDATION_ERROR', error);
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;
    
    return errorResponse(message, 500, 'INTERNAL_ERROR');
  }

  // Fallback for unknown errors
  return errorResponse('Internal server error', 500, 'UNKNOWN_ERROR');
}

/**
 * Validate request method
 */
export function validateMethod(
  request: Request, 
  allowedMethods: string[]
): void {
  if (!allowedMethods.includes(request.method)) {
    throw new ApiError(
      `Method ${request.method} not allowed`, 
      405, 
      'METHOD_NOT_ALLOWED'
    );
  }
}

/**
 * Rate limiting helper (basic implementation)
 * In production, consider using a proper rate limiting service
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): void {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return;
  }

  if (record.count >= maxRequests) {
    throw new ApiError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }

  record.count++;
}

/**
 * Clean up old rate limit records (call periodically)
 */
export function cleanupRateLimitRecords(): void {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}