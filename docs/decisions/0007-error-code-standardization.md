# ADR 0007: Error Code Standardization

## Status
Accepted

## Date
2025-12-04

## Context

AppDistillery needs consistent, type-safe error handling that supports:

- **Programmatic error handling** - Client code can switch on error codes, not string matching
- **i18n readiness** - User-facing messages can be translated while error codes remain stable
- **Type safety** - TypeScript ensures only valid error codes are used
- **User-friendly messages** - End users see clear, actionable error messages
- **Debugging support** - Developers can trace errors by code

Before standardization, errors were handled inconsistently:
```typescript
// Inconsistent error patterns
throw new Error('User not authorized');
return { error: 'Invalid prompt' };
throw new Error('Generation failed: ' + details);
return { success: false, message: 'Something went wrong' };
```

This created problems:
- Cannot programmatically handle errors (string matching is fragile)
- Error messages hardcoded in English throughout codebase
- No standard error response format
- Difficult to track error frequency by type

## Options Considered

### Option A: String literal errors

**Description**: Continue using plain string messages for errors.

**Pros**:
- Simple to implement
- No additional code needed
- Flexible messaging

**Cons**:
- No type safety
- String matching for error handling is fragile
- Cannot translate messages (i18n impossible)
- No standardization across modules
- Difficult to analyze error patterns

### Option B: Custom error classes

**Description**: Create error class hierarchy (e.g., `AuthError`, `ValidationError`, `AIError`).

**Pros**:
- Object-oriented pattern
- Can add methods to error classes
- `instanceof` checks for error types
- Stack traces included

**Cons**:
- Verbose to define many error classes
- Serialization issues (errors sent to client lose class info)
- Difficult to use in Result types (discriminated unions)
- Over-engineered for current needs

### Option C: Error codes enum with message mapping

**Description**: Define error codes as TypeScript enum, map codes to user-friendly messages.

**Pros**:
- Type-safe error codes
- Programmatic error handling (switch on code)
- Centralized message definitions
- i18n-ready (messages can be replaced with translation keys)
- Works with discriminated unions
- Serializable (codes are strings)

**Cons**:
- Must maintain enum and message mapping in sync
- Requires exporting from central location

## Decision

We will use **Option C: Error codes enum with message mapping**:

```typescript
// packages/core/src/utils/error-codes.ts
export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Brain errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_PROMPT: 'INVALID_PROMPT',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',

  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorMessages: Record<ErrorCode, string> = {
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  RATE_LIMIT_EXCEEDED: "You've reached the usage limit. Please wait before trying again.",
  INVALID_PROMPT: 'Please provide valid content for your request.',
  // ...
};

export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] ?? ErrorMessages.INTERNAL_ERROR;
}

export function createErrorResult(
  code: ErrorCode,
  details?: string
): { success: false; error: string; code: ErrorCode } {
  return {
    success: false,
    error: details ?? getErrorMessage(code),
    code,
  };
}
```

### Usage Pattern

**In Server Actions:**
```typescript
import { ErrorCodes, createErrorResult } from '@appdistillery/core/utils/error-codes';

export async function performAction(input: Input): Promise<Result<Output>> {
  const session = await getSessionContext();

  if (!session) {
    return createErrorResult(ErrorCodes.UNAUTHORIZED);
  }

  try {
    // ... operation
    return { success: true, data: result };
  } catch (error) {
    return createErrorResult(
      ErrorCodes.INTERNAL_ERROR,
      error instanceof Error ? error.message : undefined
    );
  }
}
```

**In Client Components:**
```typescript
const result = await performAction(input);

if (!result.success) {
  // Type-safe error handling
  switch (result.code) {
    case ErrorCodes.UNAUTHORIZED:
      router.push('/login');
      break;
    case ErrorCodes.RATE_LIMIT_EXCEEDED:
      showRateLimitModal();
      break;
    default:
      toast.error(result.error);
  }
  return;
}

// TypeScript knows result.data exists here
processData(result.data);
```

### Result Type Pattern

Standard discriminated union for all Server Actions:

```typescript
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };
```

## Consequences

### Positive

- **Type safety** - ErrorCode type prevents typos, enables autocomplete
- **Consistent format** - All error responses follow same structure
- **i18n-ready** - Error codes can map to translation keys
  ```typescript
  // Future i18n integration
  function getLocalizedError(code: ErrorCode, locale: string): string {
    return translations[locale][code] ?? ErrorMessages[code];
  }
  ```
- **Programmatic handling** - Switch on error code, not string matching
- **User-friendly** - Clear, actionable messages for end users
- **Centralized** - All error messages defined in one place
- **Analytics-friendly** - Track error rates by code

### Negative

- **Enum maintenance** - Must keep ErrorCodes and ErrorMessages in sync
  - Mitigation: TypeScript Record type ensures complete mapping
- **Generic messages** - Code maps to generic message, details may be needed
  - Mitigation: `createErrorResult()` accepts optional details parameter
- **i18n not implemented yet** - Currently English only
  - Plan: Replace ErrorMessages with i18n keys when multi-language support added

### Code Organization

**Error codes grouped by domain:**
```typescript
// Auth errors (UNAUTHORIZED, SESSION_EXPIRED, etc.)
// Brain errors (RATE_LIMIT_EXCEEDED, INVALID_PROMPT, etc.)
// Ledger errors (USAGE_RECORD_FAILED, etc.)
// Module errors (MODULE_NOT_FOUND, etc.)
// General errors (INTERNAL_ERROR, VALIDATION_ERROR)
```

### Migration Path

**Phase 1: New code (immediate)**
- All new Server Actions use ErrorCodes + Result type
- All new error handling uses createErrorResult()

**Phase 2: Existing code (gradual)**
- Convert high-traffic actions first (auth, brainHandle)
- Update error handling in client components
- No hard deadline - convert as code is modified

**Phase 3: i18n integration (future)**
- Replace ErrorMessages with i18n translation keys
- Add locale parameter to getErrorMessage()
- Example: `t('errors.UNAUTHORIZED')` instead of hardcoded string

### Future Enhancements

**Structured error details:**
```typescript
export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  field?: string;        // For validation errors
  retryAfter?: number;   // For rate limit errors
  help?: string;         // Additional help text
}
```

**Error tracking integration:**
```typescript
export function createErrorResult(code: ErrorCode, details?: string) {
  // Log to monitoring service
  if (process.env.NODE_ENV === 'production') {
    logErrorToAnalytics(code);
  }

  return { success: false, error: details ?? getErrorMessage(code), code };
}
```

### Risks

- **Incomplete adoption** - Some code may still use string errors
  - Mitigation: Code review enforces ErrorCodes usage
- **Code exhaustiveness** - May need new codes as features added
  - Mitigation: Easy to add new codes, TypeScript ensures mapping updated

## References

- Implementation: `packages/core/src/utils/error-codes.ts`
- Standard Result type pattern used throughout Server Actions
- Related: ADR-0006 Structured Logging (error logging uses logger + error codes)
- Future: i18n integration (multi-language error messages)
