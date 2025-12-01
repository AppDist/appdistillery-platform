---
description: Comprehensive pre-commit verification (hardcoded values, i18n, imports, build)
argument-hint: [scope] (optional - verifies changed files if omitted)
---

# Comprehensive Verification

**Input:** $ARGUMENTS

Run comprehensive verification checks before committing code. This catches issues that individual reviews might miss.

---

## Scope Detection

**If scope provided:**
- Verify only specified files/directories

**If no scope:**
- Detect changed files via `git diff --name-only HEAD`
- Focus verification on those files

---

## Verification Checks

Run ALL checks in sequence. Stop and report if any check fails.

### 1. Build Verification (MANDATORY)

```bash
pnpm typecheck && pnpm build
```

If this fails, STOP and report errors. No point checking other things if code doesn't compile.

### 2. Hardcoded Design Values

Scan changed `.tsx` and `.css` files for non-token values:

**Colors to flag:**
```regex
#[0-9a-fA-F]{3,8}        # Hex colors
rgb\(|rgba\(|hsl\(       # Color functions
```

**Spacing to flag:**
```regex
p-\[\d+px\]              # Custom padding like p-[17px]
m-\[\d+px\]              # Custom margin
gap-\[\d+px\]            # Custom gap
```

**Font sizes to flag:**
```regex
text-\[\d+px\]           # Custom font size
font-size:\s*\d+px       # Inline font-size
```

**Allowed exceptions:**
- Comments explaining why token doesn't exist
- Third-party library overrides
- SVG paths and icons

**Report format:**
```
## Hardcoded Design Values Found

| File | Line | Issue | Should Use |
|------|------|-------|------------|
| component.tsx | 45 | #0f6ecc | bg-primary |
| form.tsx | 23 | p-[17px] | p-4 (16px) |
```

### 3. i18n Compliance (Full Audit)

Use the existing `/i18n-audit` command logic to check changed files.

Flag ALL user-facing strings that should use i18n:
- Button labels: `>Submit<`, `>Cancel<`
- Form labels: `<Label>Name</Label>`
- Error messages: `setError("...")` with hardcoded strings
- Page titles, descriptions, placeholder text

**Allowed exceptions:**
- Technical strings (class names, IDs)
- Console/debug messages
- Test files

**Report format:**
```
## i18n Violations Found

| File | Line | String | Suggestion |
|------|------|--------|------------|
| form.tsx | 12 | "Submit" | t('common.submit') |
| page.tsx | 5 | "Create Account" | t('auth.createAccount') |
```

### 4. Import/Link Verification

Check that all imports in changed files resolve:

```bash
# TypeScript should catch this, but double-check
pnpm typecheck --filter @appdistillery/web
```

Also check for:
- Broken relative imports (`../../../` that don't exist)
- Missing package exports
- Circular dependencies (if detected)

### 5. Quality Checks

Scan for code quality issues:

**TODO/FIXME comments:**
```regex
TODO|FIXME|HACK|XXX
```
Report any in new code (warn, don't fail - but document them)

**Console statements:**
```regex
console\.(log|warn|error|debug|info)
```
Flag any outside of development/debug utilities

**Unsafe type assertions:**
```regex
as any(?!\s*//.*justified|TODO)
```
Flag `as any` without justification comment

---

## Output Format

```markdown
# Verification Results

## Summary
| Check | Status | Issues |
|-------|--------|--------|
| Build | PASS/FAIL | 0 |
| Design Tokens | PASS/WARN | 3 |
| i18n | PASS/WARN | 5 |
| Imports | PASS/FAIL | 0 |
| Quality | PASS/WARN | 2 |

## Details

### Build
[Build output if failed]

### Design Tokens
[Table of violations]

### i18n
[Table of violations]

### Quality
[Table of issues]

## Recommendation
[READY TO COMMIT / FIX REQUIRED / WARNINGS TO ADDRESS]
```

---

## Exit Criteria

| Status | Meaning |
|--------|---------|
| **READY** | All checks pass, safe to commit |
| **FIX REQUIRED** | Build fails or critical issues - must fix |
| **WARNINGS** | Non-blocking issues - consider fixing |

---

## Usage Examples

```bash
/verify                           # Verify changed files
/verify apps/web/src/components/  # Verify specific directory
/verify --all                     # Verify entire codebase (slow)
```
