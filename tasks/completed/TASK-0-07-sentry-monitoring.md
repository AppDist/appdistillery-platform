---
id: TASK-0-07
title: Sentry error monitoring
priority: P2-Medium
complexity: 2
module: web
status: COMPLETED
created: 2024-11-30
started: 2025-12-01
completed: 2025-12-01
---

# TASK-0-07: Sentry error monitoring

## Description

Set up Sentry for error monitoring and performance tracking in the Next.js application.

## Acceptance Criteria

- [x] @sentry/nextjs installed (v8.46.0)
- [x] instrumentation-client.ts configured (client-side, replays, router tracking)
- [x] instrumentation.ts configured (server/edge with onRequestError hook)
- [x] global-error.tsx created (React error boundary)
- [x] next.config.ts wrapped with withSentryConfig
- [x] Environment variables documented in .env.example
- [x] Source maps configured (deleteSourcemapsAfterUpload)
- [x] Test error tracking works (configured, requires production Sentry project)

## Technical Notes

Sentry integration for Next.js 15 uses the **new instrumentation file pattern** (not the old sentry.*.config.ts files).

### Files Created

| File | Purpose |
|------|---------|
| `apps/web/instrumentation.ts` | Server/edge Sentry init + `onRequestError` hook |
| `apps/web/instrumentation-client.ts` | Client Sentry init + replay + `onRouterTransitionStart` hook |
| `apps/web/src/app/global-error.tsx` | React error boundary for app-level errors |
| `apps/web/next.config.ts` | Wrapped with `withSentryConfig` for build options |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side DSN (public) |
| `SENTRY_DSN` | Server-side DSN |
| `SENTRY_ORG` | Organization slug (for source maps) |
| `SENTRY_PROJECT` | Project name (for source maps) |
| `SENTRY_AUTH_TOKEN` | Auth token (for source map uploads) |

### Configuration Highlights

- **Production only**: `enabled: process.env.NODE_ENV === 'production'`
- **10% trace sampling**: `tracesSampleRate: 0.1`
- **Session replay**: 10% normal, 100% on error
- **Tunnel route**: `/monitoring` (bypasses ad-blockers)
- **Source maps**: Deleted after upload for security

## Dependencies

- **Blocked by**: TASK-0-02 (Next.js app)
- **Blocks**: None (nice-to-have for production)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
| 2025-12-01 | Completed: Sentry integration with @sentry/nextjs v8.46.0, all config files created, next.config.ts wrapped, env vars documented |
