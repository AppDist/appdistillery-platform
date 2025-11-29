# TypeScript Debugging Reference

Debugging type errors, inference issues, and TypeScript-specific problems.

## Contents

- Understanding type errors
- Common type error patterns
- Type inference debugging
- Source map configuration
- Advanced type debugging
- Performance optimization

## Understanding Type Errors

### Anatomy of a Type Error

```
src/components/Button.tsx:15:7 - error TS2322: Type 'string' is not assignable to type 'number'.

15       count={label}
         ~~~~~

  src/components/Button.tsx:5:3
    5   count: number;
        ~~~~~
    The expected type comes from property 'count' which is declared here on type 'ButtonProps'
```

**Parsing the error:**
1. **Location**: `src/components/Button.tsx:15:7` - File, line, column
2. **Error code**: `TS2322` - TypeScript error number (searchable)
3. **Message**: `Type 'string' is not assignable to type 'number'`
4. **Context**: Shows the problematic code and where the type is defined

### Error Code Categories

| Code Range | Category | Example |
|------------|----------|---------|
| TS1xxx | Syntax errors | TS1005: ';' expected |
| TS2xxx | Semantic errors | TS2322: Type not assignable |
| TS4xxx | Declaration errors | TS4060: Return type cannot be inferred |
| TS5xxx | Config errors | TS5024: Unknown compiler option |
| TS6xxx | Suggestions | TS6133: Variable declared but never used |
| TS7xxx | Strict mode | TS7006: Parameter has implicit 'any' type |

## Common Type Error Patterns

### TS2322: Type Not Assignable

**Problem:**
```typescript
// Type 'string | undefined' is not assignable to type 'string'
const value: string = maybeString  // maybeString: string | undefined
```

**Solutions:**
```typescript
// 1. Non-null assertion (use carefully)
const value: string = maybeString!

// 2. Default value
const value: string = maybeString ?? ''

// 3. Type guard
if (maybeString !== undefined) {
  const value: string = maybeString  // narrowed to string
}

// 4. Fix the source type
function getString(): string {  // Not string | undefined
  return data ?? ''
}
```

### TS2339: Property Does Not Exist

**Problem:**
```typescript
// Property 'x' does not exist on type 'Y'
user.profile.avatar  // Error if profile might not have avatar
```

**Solutions:**
```typescript
// 1. Use optional chaining
user.profile?.avatar

// 2. Add property to type
interface Profile {
  avatar?: string  // Mark as optional
}

// 3. Type assertion (use carefully)
(user.profile as ProfileWithAvatar).avatar

// 4. Type guard
function hasAvatar(profile: Profile): profile is Profile & { avatar: string } {
  return 'avatar' in profile && typeof profile.avatar === 'string'
}
```

### TS2345: Argument Type Mismatch

**Problem:**
```typescript
// Argument of type 'X' is not assignable to parameter of type 'Y'
processItems([1, 2, 3])  // Expected Item[], got number[]
```

**Solutions:**
```typescript
// 1. Transform the data
processItems([1, 2, 3].map(n => ({ id: n })))

// 2. Use generic function
function processItems<T>(items: T[]) { ... }

// 3. Widen the parameter type
function processItems(items: (Item | number)[]) { ... }
```

### TS2571: Object is 'unknown'

**Problem:**
```typescript
try {
  // ...
} catch (error) {
  console.log(error.message)  // 'error' is of type 'unknown'
}
```

**Solution:**
```typescript
try {
  // ...
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message)  // TypeScript knows it's an Error
  } else {
    console.log(String(error))
  }
}

// Or create a helper
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}
```

### TS7006: Implicit 'any'

**Problem:**
```typescript
// Parameter 'x' implicitly has an 'any' type
function process(data) { ... }  // Missing type annotation
```

**Solution:**
```typescript
// Add explicit type
function process(data: ProcessData) { ... }

// Or if truly any type is acceptable
function process(data: unknown) { ... }
```

## Type Inference Debugging

### Inspecting Inferred Types

```typescript
// Hover over variable in VSCode to see inferred type

// Or use type assertion for debugging
type Debug<T> = { [K in keyof T]: T[K] }

// Use satisfies to check type while preserving inference
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
} satisfies Record<string, string | number>

// Type is preserved: { apiUrl: string, timeout: number }
// Not widened to: Record<string, string | number>
```

### Finding Type Source

```typescript
// Check where type comes from
type UserFromAPI = Awaited<ReturnType<typeof fetchUser>>

// Hover over ReturnType to see what it resolves to
type QueryResult = ReturnType<typeof useQuery<User>>
```

### Type Utility for Debugging

```typescript
// Pretty print complex types
type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

// Usage
type UserData = Prettify<User & { metadata: Metadata }>
// Hover shows expanded type instead of intersection
```

## Source Map Configuration

### tsconfig.json for Debugging

```json
{
  "compilerOptions": {
    // Essential for debugging
    "sourceMap": true,
    "inlineSources": true,
    
    // Recommended for development
    "declaration": true,
    "declarationMap": true,
    
    // Strict mode catches more errors
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    
    // Catch unused code
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    
    // Better error messages
    "pretty": true
  }
}
```

### Verifying Source Maps

```bash
# Check source maps are generated
ls -la dist/*.js.map

# Verify source map content
cat dist/index.js.map | jq '.sources'
```

### VSCode Source Map Debugging

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug TypeScript",
  "program": "${workspaceFolder}/src/index.ts",
  "preLaunchTask": "tsc: build",
  "outFiles": ["${workspaceFolder}/dist/**/*.js"],
  "sourceMaps": true,
  "smartStep": true,
  "skipFiles": ["<node_internals>/**", "**/node_modules/**"]
}
```

## Advanced Type Debugging

### Conditional Type Debugging

```typescript
// Debug conditional type resolution
type TestCondition = string extends unknown ? 'yes' : 'no'  // 'yes'

// Check distribution behavior
type Distributed = (string | number) extends unknown 
  ? 'distributed' 
  : 'not distributed'
```

### Generic Constraint Issues

```typescript
// Error: Type 'T' does not satisfy constraint
function process<T extends { id: string }>(item: T) {
  return item.id
}

// Debug by checking what T resolves to
process({ id: 123 })  // Error: number not assignable to string

// Fix: Widen constraint or fix call site
function process<T extends { id: string | number }>(item: T) {
  return String(item.id)
}
```

### Module Augmentation Debugging

```typescript
// If augmentation not working, check:

// 1. File is a module (has import/export)
export {}  // Makes file a module

// 2. Correct module path
declare module 'library-name' {  // Must match import path
  interface ExistingInterface {
    newProperty: string
  }
}

// 3. tsconfig includes the file
{
  "include": ["src/**/*", "types/**/*"]
}
```

## Type Performance

### Slow Type Checking

```bash
# Measure type checking time
time pnpm tsc --noEmit

# Extended diagnostics
pnpm tsc --noEmit --extendedDiagnostics

# Generate trace for analysis
pnpm tsc --noEmit --generateTrace ./trace
# Open trace in chrome://tracing
```

### Optimizing Types

```typescript
// ❌ Slow: Complex conditional types evaluated repeatedly
type DeepPartial<T> = T extends object 
  ? { [K in keyof T]?: DeepPartial<T[K]> } 
  : T

// ✅ Faster: Cache with interface
interface DeepPartialObject<T> {
  [K in keyof T]?: DeepPartial<T[K]>
}
type DeepPartial<T> = T extends object ? DeepPartialObject<T> : T

// ❌ Slow: Overuse of mapped types
type AllOptional<T> = { [K in keyof T]?: T[K] }
type AllReadonly<T> = { readonly [K in keyof T]: T[K] }
type Combined<T> = AllReadonly<AllOptional<T>>

// ✅ Faster: Combine in one mapped type
type Combined<T> = { readonly [K in keyof T]?: T[K] }
```

### Skip Library Check

```json
// tsconfig.json - Skip type checking node_modules
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

## Type-Safe Patterns

### Runtime Type Validation

```typescript
import { z } from 'zod'

// Define schema
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
})

// Infer TypeScript type from schema
type User = z.infer<typeof UserSchema>

// Validate at runtime
function processUser(data: unknown): User {
  return UserSchema.parse(data)  // Throws if invalid
}

// Safe parsing (no throw)
const result = UserSchema.safeParse(data)
if (result.success) {
  const user: User = result.data
} else {
  console.error('Validation errors:', result.error.issues)
}
```

### Type Guards

```typescript
// Custom type guard
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).email === 'string'
  )
}

// Usage
if (isUser(data)) {
  // data is now typed as User
  console.log(data.email)
}
```

## TypeScript Debugging Checklist

When facing type errors:

- [ ] Read the full error message including location
- [ ] Check the error code (TS####) for specific guidance
- [ ] Hover over problematic code to see inferred types
- [ ] Check where the expected type is defined
- [ ] Verify tsconfig.json settings are correct
- [ ] Consider if strict mode is causing the issue
- [ ] Check for missing type definitions (@types/*)
- [ ] Restart TS server if types seem stale
- [ ] Use `satisfies` operator for type checking with inference
- [ ] Consider runtime validation for external data

## Quick Fixes

```bash
# TypeScript errors don't match IDE
# Restart TS server: Cmd+Shift+P > "TypeScript: Restart TS Server"

# Missing type definitions
pnpm add -D @types/package-name

# Check TypeScript version matches
pnpm tsc --version
cat package.json | grep typescript

# Generate types from database/API
pnpm supabase gen types typescript > src/types/database.ts
```
