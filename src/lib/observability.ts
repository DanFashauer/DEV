/**
 * Observability Middleware
 * 
 * Provides request tracing and structured logging for the API.
 * 
 * Features:
 * - Request ID generation and propagation
 * - Structured logging with consistent format
 * - Latency tracking
 * - Error context capture
 * 
 * Usage:
 * - Import and use in API routes
 * - All logs include: requestId, route, method, latencyMs
 * - Sensitive data is never logged
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

// ============================================================================
// Types
// ============================================================================

/**
 * Structured log entry format
 */
export interface LogEntry {
  /** ISO timestamp */
  timestamp: string;
  /** Unique request identifier */
  requestId: string;
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Event name */
  event: string;
  /** HTTP method */
  method?: string;
  /** Request path */
  route?: string;
  /** Response status code */
  statusCode?: number;
  /** Latency in milliseconds */
  latencyMs?: number;
  /** Device ID if available */
  deviceId?: string;
  /** User ID if available */
  userId?: string;
  /** Error message if applicable */
  error?: string;
  /** Additional context (never include secrets) */
  context?: Record<string, unknown>;
}

/**
 * Extended request with observability context
 */
export interface ObservabilityContext {
  requestId: string;
  startTime: number;
  deviceId?: string;
  userId?: string;
}

// ============================================================================
// Constants
// ============================================================================

const REQUEST_ID_HEADER = 'x-request-id';
const REQUEST_ID_LENGTH = 16;

// ============================================================================
// Request ID Management
// ============================================================================

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return randomBytes(REQUEST_ID_LENGTH).toString('hex');
}

/**
 * Get or create request ID from request headers
 */
export function getRequestId(request: NextRequest): string {
  // Check header first
  const headerId = request.headers.get(REQUEST_ID_HEADER);
  if (headerId && headerId.length > 0 && headerId.length <= 64) {
    return headerId;
  }
  
  // Generate new ID
  return generateRequestId();
}

/**
 * Create observability context for a request
 */
export function createContext(request: NextRequest): ObservabilityContext {
  return {
    requestId: getRequestId(request),
    startTime: Date.now(),
  };
}

// ============================================================================
// Structured Logging
// ============================================================================

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: LogEntry['level'],
  event: string,
  request: NextRequest,
  context?: ObservabilityContext,
  additional?: Partial<LogEntry>
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    requestId: context?.requestId || getRequestId(request),
    level,
    event,
    method: request.method,
    route: new URL(request.url).pathname,
    ...additional,
  };
  
  if (context) {
    entry.latencyMs = Date.now() - context.startTime;
    if (context.deviceId) entry.deviceId = context.deviceId;
    if (context.userId) entry.userId = context.userId;
  }
  
  return entry;
}

/**
 * Log a structured message (console JSON for production, pretty for dev)
 */
function log(entry: LogEntry): void {
  // Never log secrets - ensure context is safe
  const safeEntry = { ...entry };
  if (safeEntry.context) {
    // Remove potentially sensitive keys
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'authorization', 'cookie'];
    for (const key of Object.keys(safeEntry.context)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        delete safeEntry.context[key];
      }
    }
  }
  
  const logLine = JSON.stringify(safeEntry);
  
  switch (entry.level) {
    case 'error':
      console.error(logLine);
      break;
    case 'warn':
      console.warn(logLine);
      break;
    default:
      console.log(logLine);
  }
}

// ============================================================================
// Logging Functions
// ============================================================================

/**
 * Log debug message
 */
export function logDebug(
  request: NextRequest,
  event: string,
  context?: ObservabilityContext,
  additional?: Partial<LogEntry>
): void {
  log(createLogEntry('debug', event, request, context, additional));
}

/**
 * Log info message
 */
export function logInfo(
  request: NextRequest,
  event: string,
  context?: ObservabilityContext,
  additional?: Partial<LogEntry>
): void {
  log(createLogEntry('info', event, request, context, additional));
}

/**
 * Log warning
 */
export function logWarn(
  request: NextRequest,
  event: string,
  context?: ObservabilityContext,
  additional?: Partial<LogEntry>
): void {
  log(createLogEntry('warn', event, request, context, additional));
}

/**
 * Log error with context
 */
export function logError(
  request: NextRequest,
  event: string,
  error: Error | string,
  context?: ObservabilityContext,
  additional?: Partial<LogEntry>
): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;
  
  log(createLogEntry('error', event, request, context, {
    ...additional,
    error: errorMessage,
    context: {
      ...additional?.context,
      stack: errorStack,
    },
  }));
}

// ============================================================================
// Middleware Helpers
// ============================================================================

/**
 * Create response with request ID header
 */
export function createResponse(
  request: NextRequest,
  context: ObservabilityContext,
  data: unknown,
  status: number = 200
): NextResponse {
  // Log the request
  log(createLogEntry('info', 'request.completed', request, context, {
    statusCode: status,
  }));
  
  return NextResponse.json(data, {
    status,
    headers: {
      [REQUEST_ID_HEADER]: context.requestId,
    },
  });
}

/**
 * Create error response with request ID
 */
export function createErrorResponse(
  request: NextRequest,
  context: ObservabilityContext,
  message: string,
  status: number = 500
): NextResponse {
  // Log the error
  log(createLogEntry('error', 'request.error', request, context, {
    statusCode: status,
    error: message,
  }));
  
  return NextResponse.json(
    { error: message, requestId: context.requestId },
    {
      status,
      headers: {
        [REQUEST_ID_HEADER]: context.requestId,
      },
    }
  );
}

/**
 * Wrap API route handler with observability
 */
export function withObservability(
  handler: (request: NextRequest, context: ObservabilityContext) => Promise<NextResponse>
) {
  return async function (request: NextRequest): Promise<NextResponse> {
    const context = createContext(request);
    
    try {
      // Log incoming request
      log(createLogEntry('info', 'request.started', request, context));
      
      const response = await handler(request, context);
      
      // Add request ID to response headers
      response.headers.set(REQUEST_ID_HEADER, context.requestId);
      
      return response;
    } catch (error) {
      // Log unhandled error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      log(createLogEntry('error', 'request.exception', request, context, {
        error: errorMessage,
        context: { stack: errorStack },
      }));
      
      return createErrorResponse(request, context, 'Internal server error', 500);
    }
  };
}

// ============================================================================
// Request Context Helpers
// ============================================================================

/**
 * Add device ID to context
 */
export function withDeviceId(context: ObservabilityContext, deviceId: string): ObservabilityContext {
  return { ...context, deviceId };
}

/**
 * Add user ID to context
 */
export function withUserId(context: ObservabilityContext, userId: string): ObservabilityContext {
  return { ...context, userId };
}

// ============================================================================
// Export
// ============================================================================

export { REQUEST_ID_HEADER };
