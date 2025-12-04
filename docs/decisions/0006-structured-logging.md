# ADR 0006: Structured Logging

## Status
Accepted

## Date
2025-12-04

## Context

As the AppDistillery Platform grows in complexity, scattered `console.log()` and `console.error()` calls throughout the codebase make debugging and monitoring increasingly difficult. We need:

- **Consistent log format** - Standardized structure across all packages
- **Context identification** - Clear indication of which component logged the message
- **Severity levels** - Ability to filter logs by importance (error, warn, info, debug)
- **Structured metadata** - Attach data objects to logs without manual JSON.stringify()
- **Production readiness** - Foundation for future integration with monitoring tools (Sentry, Datadog, etc.)

The codebase had a mix of logging patterns:
```typescript
// Inconsistent patterns found in codebase
console.error('Error in getActiveTenant:', error);
console.warn('[getActiveTenant] User not authenticated');
console.log('Cache hit:', cacheKey);
```

## Options Considered

### Option A: Continue with console.* methods

**Description**: Keep using native `console.log`, `console.error`, `console.warn`, `console.info` directly.

**Pros**:
- No additional dependencies
- Works everywhere (Node.js, browser, Edge Runtime)
- Zero learning curve

**Cons**:
- No standardization of log format
- Difficult to add structured metadata
- Cannot easily integrate with monitoring tools
- No centralized control over log levels
- Manual context string formatting (`[component] message`)

### Option B: Use winston or pino

**Description**: Adopt a mature logging library like winston or pino.

**Pros**:
- Feature-rich (transports, log rotation, formatting)
- Battle-tested in production environments
- Extensive plugin ecosystem
- Built-in structured logging

**Cons**:
- Additional dependency (~200KB for winston, ~50KB for pino)
- Overkill for current needs
- Configuration complexity
- May not work in Edge Runtime (Vercel Edge Functions)
- Adds learning curve for contributors

### Option C: Custom structured logger (thin wrapper)

**Description**: Create a minimal custom logger that wraps `console.*` with standardized format.

**Pros**:
- Lightweight (~40 lines of code, zero dependencies)
- Works everywhere (Edge Runtime, Node.js, browser)
- Consistent log format across codebase
- Easy to extend with Sentry/monitoring later
- Simple API: `logger.error(context, message, data)`
- Full control over formatting

**Cons**:
- Custom code to maintain
- Fewer features than winston/pino
- No built-in transports (file logging, etc.)

## Decision

We will use **Option C: Custom structured logger** with this implementation:

```typescript
// packages/core/src/utils/logger.ts
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogData {
  [key: string]: unknown;
}

function formatMessage(context: string, message: string): string {
  return `[${context}] ${message}`;
}

export const logger = {
  error(context: string, message: string, data?: LogData): void {
    console.error(formatMessage(context, message), data ?? '');
    // Future: Sentry.captureException()
  },

  warn(context: string, message: string, data?: LogData): void {
    console.warn(formatMessage(context, message), data ?? '');
  },

  info(context: string, message: string, data?: LogData): void {
    console.info(formatMessage(context, message), data ?? '');
  },

  debug(context: string, message: string, data?: LogData): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage(context, message), data ?? '');
    }
  },
};
```

### Usage Pattern

**Replace scattered console calls:**
```typescript
// ❌ Before: Inconsistent format
console.error('Error in getActiveTenant:', error);

// ✅ After: Structured logging
import { logger } from '@appdistillery/core/utils/logger';
logger.error('getActiveTenant', 'Unexpected error', { error });
```

### Log Format

All logs follow this format:
```
[context] message {data}
```

Example outputs:
```
[brainHandle] AI generation failed { taskType: 'agency.scope', error: '...' }
[getActiveTenant] User not authenticated
[recordUsage] Usage recorded { orgId: 'uuid', units: 50 }
```

## Consequences

### Positive

- **Consistent format** - All logs have `[context] message {data}` structure
- **Easy grep/search** - Find all logs from a component: `grep "\[brainHandle\]" logs`
- **Structured metadata** - Pass objects directly, no manual formatting
- **Environment-aware** - Debug logs only in development
- **Future-proof** - Single point to add Sentry integration
- **Zero dependencies** - No external packages, works in Edge Runtime
- **Simple migration** - Find/replace `console.error` with `logger.error`

### Negative

- **Custom code to maintain** - Must update logger ourselves (not a library)
- **No file transports** - Only console output (acceptable for serverless)
- **No log rotation** - Relies on infrastructure (Vercel automatically rotates logs)
- **Manual adoption** - Must convert existing console.* calls over time

### Migration Strategy

**Phase 1: New code (immediate)**
- All new code MUST use `logger.*` instead of `console.*`
- Code review enforces this pattern

**Phase 2: Critical paths (within 1 month)**
- Convert error paths first: auth, brainHandle, recordUsage
- Use grep to find: `grep -r "console.error" packages/core/src`

**Phase 3: Complete migration (gradual)**
- Convert remaining console calls as files are modified
- No hard deadline - low priority

### Future Enhancements

When ready to add monitoring:

```typescript
// Add Sentry integration in logger.error()
export const logger = {
  error(context: string, message: string, data?: LogData): void {
    console.error(formatMessage(context, message), data ?? '');

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(new Error(message), {
        tags: { context },
        extra: data,
      });
    }
  },
  // ...
};
```

### Risks

- **Incomplete adoption** - Some code may continue using console.* directly
  - Mitigation: ESLint rule to warn on console.* usage
- **Lost stack traces** - Wrapping console may affect stack traces
  - Mitigation: Tested; stack traces preserved correctly

## References

- Implementation: `packages/core/src/utils/logger.ts`
- Usage example: `packages/core/src/auth/get-active-tenant.ts` (line 104)
- Usage example: `packages/core/src/brain/brain-handle-helpers.ts` (line 11)
- Related: Future Sentry integration (not yet implemented)
