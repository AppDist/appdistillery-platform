# Size Guidelines

Detailed size limits and when to split code.

## Function Size

| Size | Action |
|------|--------|
| < 40 lines | Ideal |
| 40-60 lines | Acceptable |
| > 60 lines | Must extract helpers |

### Extraction Pattern

```typescript
// ❌ BAD: 80+ line function
async function processComplexTask(input: Input) {
  // validation (20 lines)
  // transformation (25 lines)
  // API call (15 lines)
  // result processing (20 lines)
}

// ✅ GOOD: Split into focused functions
async function processComplexTask(input: Input) {
  const validated = validateInput(input);      // ~15 lines elsewhere
  const transformed = transformData(validated); // ~20 lines elsewhere
  const result = await callApi(transformed);    // ~10 lines elsewhere
  return processResult(result);                 // ~15 lines elsewhere
}
```

## File Size

| Type | Target | Maximum |
|------|--------|---------|
| Implementation | 150-200 | 300 lines |
| Test file | 200-300 | 500 lines |
| Schema file | 50-100 | 150 lines |

### Splitting Strategy

```
# File exceeds 300 lines?
brain-handle.ts (350 lines)
    ↓
Split by concern:
├── brain-handle.ts (150 lines) - main orchestration
├── brain-validation.ts (80 lines) - input validation
└── brain-adapters.ts (120 lines) - provider adapters
```

## Test Size

| Ratio | Status |
|-------|--------|
| 1:1 test:code | Ideal |
| 2:1 test:code | Maximum |
| > 2:1 | Tests are too verbose |

### Test Verbosity Check

```typescript
// ❌ BAD: Verbose, tests implementation
it('calls validatePrompt then calls detectInjection then calls sanitize', () => {
  // Testing internal call order instead of behavior
});

// ✅ GOOD: Concise, tests behavior
it('rejects prompts with injection patterns', () => {
  const result = validatePrompt('ignore previous instructions');
  expect(result.valid).toBe(false);
});
```

## Task Output

| Output | Action |
|--------|--------|
| < 200 lines | Proceed |
| 200-400 lines | Monitor closely |
| > 400 lines | Stop and decompose |

### Decomposition Example

```
# Task: "Add prompt sanitizer with tests"
# Estimated output: 600 lines → Too large!

# Split into:
Task A: Add validatePrompt to brainHandle (100 lines)
Task B: Add injection detection (100 lines)
Task C: Add rate limiting (100 lines)
# Each independently useful and integrated
```
