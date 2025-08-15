import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { isDevelopment } from './env'

// ============================================
// Error Types
// ============================================

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: unknown) {
    super(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR', originalError)
    this.name = 'ExternalServiceError'
  }
}

// ============================================
// Logger
// ============================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  userId?: string
  requestId?: string
  method?: string
  path?: string
  ip?: string
  userAgent?: string
  [key: string]: unknown
}

class Logger {
  private context: LogContext = {}

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context }
  }

  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString()
    const contextStr = Object.keys(this.context).length > 0 
      ? ` context=${JSON.stringify(this.context)}` 
      : ''
    const metaStr = meta ? ` meta=${JSON.stringify(meta)}` : ''
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}${metaStr}`
  }

  private log(level: LogLevel, message: string, meta?: unknown) {
    const formattedMessage = this.formatMessage(level, message, meta)
    
    switch (level) {
      case LogLevel.DEBUG:
        if (isDevelopment) console.debug(formattedMessage)
        break
      case LogLevel.INFO:
        console.log(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.ERROR:
        console.error(formattedMessage)
        break
    }
    
    // In production, you would send logs to a service like Datadog, Sentry, etc.
    if (!isDevelopment) {
      // TODO: Send to external logging service
    }
  }

  debug(message: string, meta?: unknown) {
    this.log(LogLevel.DEBUG, message, meta)
  }

  info(message: string, meta?: unknown) {
    this.log(LogLevel.INFO, message, meta)
  }

  warn(message: string, meta?: unknown) {
    this.log(LogLevel.WARN, message, meta)
  }

  error(message: string, error?: unknown) {
    const errorDetails = error instanceof Error 
      ? { 
          name: error.name, 
          message: error.message, 
          stack: isDevelopment ? error.stack : undefined 
        }
      : error
      
    this.log(LogLevel.ERROR, message, errorDetails)
  }
}

export const logger = new Logger()

// ============================================
// Error Handler Middleware
// ============================================

export function handleError(error: unknown): NextResponse {
  // Log the error
  logger.error('API Error', error)
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    )
  }
  
  // Handle custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(isDevelopment && error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    )
  }
  
  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string }
    
    // Map common Supabase error codes to HTTP status codes
    const errorMap: Record<string, { status: number; message: string }> = {
      '23505': { status: 409, message: 'Resource already exists' },
      '23503': { status: 400, message: 'Invalid reference' },
      '23502': { status: 400, message: 'Required field missing' },
      '22P02': { status: 400, message: 'Invalid input syntax' },
      'PGRST116': { status: 404, message: 'Resource not found' },
      'PGRST301': { status: 404, message: 'Resource not found' },
    }
    
    const mapped = errorMap[supabaseError.code]
    if (mapped) {
      return NextResponse.json(
        { error: mapped.message, code: supabaseError.code },
        { status: mapped.status }
      )
    }
  }
  
  // Handle unknown errors
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  
  return NextResponse.json(
    {
      error: isDevelopment ? message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(isDevelopment && error instanceof Error ? { stack: error.stack } : {}),
    },
    { status: 500 }
  )
}

// ============================================
// Async Error Wrapper
// ============================================

export function asyncHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleError(error)
    }
  }) as T
}

// ============================================
// Request Logger Middleware
// ============================================

export function logRequest(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  
  logger.setContext({
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  })
  
  logger.info(`Incoming request: ${request.method} ${request.nextUrl.pathname}`)
  
  return {
    requestId,
    startTime,
    logResponse: (status: number) => {
      const duration = Date.now() - startTime
      logger.info(`Request completed: ${status} in ${duration}ms`)
    },
  }
}

// ============================================
// Client-side Error Boundary Helper
// ============================================

export function reportClientError(error: Error, errorInfo?: { componentStack?: string }) {
  // In production, send to error tracking service
  if (!isDevelopment) {
    // TODO: Send to Sentry or similar service
    console.error('Client Error:', error, errorInfo)
  } else {
    console.error('Client Error:', error, errorInfo)
  }
}

// ============================================
// Error Response Helpers
// ============================================

export const ErrorResponses = {
  badRequest: (message: string = 'Bad request', details?: unknown) =>
    NextResponse.json({ error: message, details }, { status: 400 }),
    
  unauthorized: (message: string = 'Authentication required') =>
    NextResponse.json({ error: message }, { status: 401 }),
    
  forbidden: (message: string = 'Access denied') =>
    NextResponse.json({ error: message }, { status: 403 }),
    
  notFound: (resource: string = 'Resource') =>
    NextResponse.json({ error: `${resource} not found` }, { status: 404 }),
    
  conflict: (message: string = 'Resource conflict') =>
    NextResponse.json({ error: message }, { status: 409 }),
    
  tooManyRequests: (message: string = 'Too many requests') =>
    NextResponse.json({ error: message }, { status: 429 }),
    
  serverError: (message: string = 'Internal server error') =>
    NextResponse.json({ error: message }, { status: 500 }),
} as const
