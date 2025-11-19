/**
 * Sentry error tracking integration for production monitoring
 *
 * SETUP INSTRUCTIONS:
 * 1. Create account at sentry.io
 * 2. Create new Node.js project
 * 3. Copy DSN from project settings
 * 4. Set SENTRY_DSN environment variable
 * 5. Install: npm install @sentry/node @sentry/profiling-node
 * 6. Uncomment implementation code below
 *
 * USAGE:
 * import { initSentry, captureError, captureMessage } from './utils/sentry';
 *
 * // In index.ts startup
 * initSentry();
 *
 * // In error handlers
 * captureError(error, { user: req.user });
 */

// NOTE: Uncomment when Sentry is configured
// import * as Sentry from '@sentry/node';
// import { ProfilingIntegration } from '@sentry/profiling-node';

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('SENTRY_DSN not configured. Error tracking disabled.');
    }
    return;
  }

  // NOTE: Uncomment when @sentry/node is installed
  /*
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new ProfilingIntegration(),
    ],

    // Ignore common errors
    ignoreErrors: [
      'Non-Error exception captured',
      'Non-Error promise rejection captured',
    ],

    // Release tracking
    release: process.env.npm_package_version,

    // Before send hook - sanitize sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Remove sensitive query params
      if (event.request?.query_string) {
        const sanitized = event.request.query_string.replace(/token=[^&]+/g, 'token=REDACTED');
        event.request.query_string = sanitized;
      }

      return event;
    },
  });

  console.log('✅ Sentry error tracking initialized');
  */
}

/**
 * Capture an exception with context
 */
export function captureError(error: Error, context?: {
  user?: { id: string; email?: string };
  extra?: Record<string, any>;
  tags?: Record<string, string>;
}): void {
  if (!process.env.SENTRY_DSN) {
    console.error('Error (Sentry not configured):', error);
    return;
  }

  // NOTE: Uncomment when @sentry/node is installed
  /*
  Sentry.captureException(error, {
    user: context?.user,
    extra: context?.extra,
    tags: context?.tags,
  });
  */
}

/**
 * Capture a message with severity
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): void {
  if (!process.env.SENTRY_DSN) {
    console.log(`${level.toUpperCase()} (Sentry not configured):`, message);
    return;
  }

  // NOTE: Uncomment when @sentry/node is installed
  /*
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
  */
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  if (!process.env.SENTRY_DSN) return;

  // NOTE: Uncomment when @sentry/node is installed
  /*
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
  */
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUser(): void {
  if (!process.env.SENTRY_DSN) return;

  // NOTE: Uncomment when @sentry/node is installed
  // Sentry.setUser(null);
}

/**
 * Express middleware for Sentry request tracking
 */
export function sentryRequestHandler() {
  // NOTE: Uncomment when @sentry/node is installed
  // return Sentry.Handlers.requestHandler();

  return (req: any, res: any, next: any) => next();
}

/**
 * Express middleware for Sentry error tracking
 */
export function sentryErrorHandler() {
  // NOTE: Uncomment when @sentry/node is installed
  // return Sentry.Handlers.errorHandler();

  return (error: any, req: any, res: any, next: any) => next(error);
}

/**
 * Flush pending events before shutdown
 */
export async function flushSentry(timeout = 2000): Promise<void> {
  if (!process.env.SENTRY_DSN) return;

  // NOTE: Uncomment when @sentry/node is installed
  // await Sentry.close(timeout);
}
