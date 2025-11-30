---
description: Check for hydration mismatch patterns in components
argument-hint: [component-path] (optional - searches all if omitted)
---

# Hydration Mismatch Check

**Input:** $ARGUMENTS

---

## Instructions

You are checking for hydration mismatch patterns that cause SSR/client rendering inconsistencies in the AppDistillery Platform.

### Step 1: Load Context

Load the debugging skill:
```
Skill("debugging")
```

### Step 2: Determine Scope

If `$ARGUMENTS` specifies a path, focus on that component/directory.
If empty, search across these monorepo locations:
- `apps/web/app/`
- `apps/web/components/`
- `packages/ui/src/`
- `modules/*/components/`

### Step 3: Search for Common Issues

**1. Client-only APIs without guards:**
```bash
rg "localStorage|sessionStorage" --type tsx apps/ packages/ui/ modules/
rg "typeof window" --type tsx apps/ packages/ui/ modules/
```
Pattern: Direct access without `typeof window !== 'undefined'`

**2. Date/Time without consistent timezone:**
```bash
rg "new Date\(\)" --type tsx apps/ packages/ui/ modules/
rg "toLocaleString|toLocaleDateString" --type tsx apps/ packages/ui/ modules/
```
Pattern: Date formatting that differs server vs client

**3. Random values:**
```bash
rg "Math\.random|randomUUID|crypto\.random" --type tsx apps/ packages/ui/ modules/
```
Pattern: Dynamic IDs generated during render

**4. Conditional rendering issues:**
Check for `typeof window` checks that render different HTML server vs client

**5. Invalid HTML nesting:**
- `<p>` inside `<p>`
- `<div>` inside `<p>`
- Interactive elements nested incorrectly

### Step 4: Present Findings

Output report of potential hydration issues with:
- File:line location
- Issue type
- Severity (Critical/Warning/Info)
- Recommended fix pattern

### Fix Patterns

**Client-only access:**
```tsx
// Bad
const value = localStorage.getItem('key')

// Good
const [value, setValue] = useState<string | null>(null)
useEffect(() => {
  setValue(localStorage.getItem('key'))
}, [])
```

**Date consistency:**
```tsx
// Bad
<span>{new Date().toLocaleString()}</span>

// Good - suppress hydration or use consistent formatting
<span suppressHydrationWarning>{new Date().toLocaleString()}</span>
// Or use date-fns with explicit timezone
```
