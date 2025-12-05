export async function register() {
  // Only initialize Sentry in production to avoid Turbopack edge runtime issues
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const Sentry = await import('@sentry/nextjs');

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }
}

// Export hook for request error tracking in nested RSC
export const onRequestError: typeof import('@sentry/nextjs').captureRequestError = (
  ...args
) => {
  if (process.env.NODE_ENV !== 'production') return;
  import('@sentry/nextjs').then((Sentry) => Sentry.captureRequestError(...args));
};
