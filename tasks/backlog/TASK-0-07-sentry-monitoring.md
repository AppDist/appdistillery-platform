---
id: TASK-0-07
title: Sentry error monitoring
priority: P2-Medium
complexity: 2
module: web
status: BACKLOG
created: 2024-11-30
---

# TASK-0-07: Sentry error monitoring

## Description

Set up Sentry for error monitoring and performance tracking in the Next.js application.

## Acceptance Criteria

- [ ] @sentry/nextjs installed
- [ ] sentry.client.config.ts configured
- [ ] sentry.server.config.ts configured
- [ ] sentry.edge.config.ts configured
- [ ] Environment variables documented
- [ ] Source maps uploaded on build
- [ ] Test error tracking works

## Technical Notes

Sentry integration for Next.js 15:

1. **Installation**:
   ```bash
   pnpm --filter @appdistillery/web add @sentry/nextjs
   ```

2. **Config files** (create via wizard or manually):
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`

3. **Environment variables**:
   - `SENTRY_DSN` - Project DSN
   - `SENTRY_ORG` - Organization slug
   - `SENTRY_PROJECT` - Project name
   - `SENTRY_AUTH_TOKEN` - For source maps

4. **next.config.ts** wrapper:
   ```typescript
   import { withSentryConfig } from '@sentry/nextjs'
   ```

### Files to Create/Modify

- `apps/web/sentry.client.config.ts`
- `apps/web/sentry.server.config.ts`
- `apps/web/sentry.edge.config.ts`
- `apps/web/next.config.ts` - Add Sentry wrapper
- `.env.example` - Document Sentry vars

### Patterns to Follow

Configure for production only initially:
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
})
```

## Dependencies

- **Blocked by**: TASK-0-02 (Next.js app)
- **Blocks**: None (nice-to-have for production)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Task created |
