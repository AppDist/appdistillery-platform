// Only initialize Sentry in production to avoid dev mode overhead
if (process.env.NODE_ENV === 'production') {
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [Sentry.replayIntegration()],
    });
  });
}

// Export hook for router transition tracking (no-op in dev)
export const onRouterTransitionStart: typeof import('@sentry/nextjs').captureRouterTransitionStart =
  process.env.NODE_ENV === 'production'
    ? (...args) => {
        import('@sentry/nextjs').then((Sentry) =>
          Sentry.captureRouterTransitionStart(...args)
        );
      }
    : () => {};
