# TASK-1-42: Create prompt sanitizer

---
id: TASK-1-42
title: Create prompt sanitizer
status: COMPLETED
priority: P1-High
complexity: 3
module: core
created: 2025-12-03
completed: 2025-12-03
---

## Description

Create a prompt sanitizer module that validates and sanitizes user prompts before sending to AI providers. This addresses security concerns around prompt injection attacks and input validation.

## Background

Currently `brainHandle()` accepts prompts directly without validation. This creates security risks:
1. No length validation (extremely long prompts can cause timeouts/costs)
2. No injection pattern detection
3. No character encoding validation

## Acceptance Criteria

- [x] Create `packages/core/src/brain/prompt-sanitizer.ts` (255 lines)
- [x] Implement `validatePromptLength(prompt, maxLength)` - max 100k characters default
- [x] Implement `detectInjectionPatterns(prompt)` - detect common injection patterns (9 patterns)
- [x] Implement `sanitizePrompt(prompt)` - clean and normalize prompt
- [x] Implement `validatePrompt(prompt, options)` - main entry point combining all checks
- [x] Create `packages/core/src/brain/prompt-sanitizer.test.ts` (63 tests)
- [x] Export from `packages/core/src/brain/index.ts`
- [x] All tests pass with `pnpm test`
- [x] No TypeScript errors

## Implementation Summary

- Created prompt sanitizer with defense-in-depth approach
- 9 injection patterns detected (warnings, not blocks)
- ReDoS-safe regex patterns verified
- Code review: PASS (0 critical issues)
- Security review: CONDITIONAL PASS (integration with brainHandle is future task)

## Review Notes

- Injection detection returns warnings, not blocks (by design)
- Integration with brainHandle() planned for future task (TASK-1-45+)
- Example file created for documentation purposes

## Technical Details

**Files to create:**
- `packages/core/src/brain/prompt-sanitizer.ts`
- `packages/core/src/brain/prompt-sanitizer.test.ts`

**Functions to implement:**

```typescript
// Types
interface PromptValidationOptions {
  maxLength?: number // default 100_000
  detectInjection?: boolean // default true
  allowedPatterns?: RegExp[] // whitelist patterns
}

interface PromptValidationResult {
  valid: boolean
  sanitizedPrompt?: string
  errors: string[]
  warnings: string[]
}

// Functions
function validatePromptLength(prompt: string, maxLength?: number): { valid: boolean; error?: string }
function detectInjectionPatterns(prompt: string): { safe: boolean; patterns: string[] }
function sanitizePrompt(prompt: string): string
function validatePrompt(prompt: string, options?: PromptValidationOptions): PromptValidationResult
```

**Injection patterns to detect:**
- System prompt override attempts: "ignore previous instructions", "disregard above"
- Role manipulation: "you are now", "act as"
- Delimiter injection: ```system```, [INST], <<SYS>>
- Encoding attacks: base64 encoded instructions

**NOTE:** This is defensive detection, not foolproof protection. Defense in depth.

## Dependencies

- Blocked by: None
- Blocks: Integration with brainHandle (future task)

## Agent Assignment

Primary: appdistillery-developer
