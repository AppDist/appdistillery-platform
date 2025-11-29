# Build Debugging Reference

Debugging build failures, compilation errors, and bundling issues.

## Contents

- Build failure triage
- Cache and dependency issues
- TypeScript compilation errors
- Bundler-specific debugging
- Environment configuration
- CI/CD debugging

## Build Failure Triage

### Quick Diagnosis

```bash
# Step 1: Clear all caches
rm -rf .next .turbo dist node_modules/.cache

# Step 2: Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml  # or package-lock.json / yarn.lock
pnpm install

# Step 3: Run build with verbose output
DEBUG=* pnpm build 2>&1 | tee build.log

# Step 4: Check TypeScript separately
pnpm tsc --noEmit
```

### Error Categories

| Error Pattern | Likely Cause | Solution |
|--------------|--------------|----------|
| `Module not found` | Missing dependency or wrong import | Check import path, install package |
| `Type error` | TypeScript type mismatch | Fix types, check `tsconfig.json` |
| `Syntax error` | Invalid JavaScript/TypeScript | Check file for syntax issues |
| `Out of memory` | Large bundle, memory limit | Increase Node memory, optimize bundle |
| `ENOENT` | Missing file | Check file exists, correct path |
| `Permission denied` | File system permissions | Check file permissions |

## Cache and Dependency Issues

### The Nuclear Option

When nothing else works:

```bash
#!/bin/bash
# clean-build.sh - Complete clean build

echo "Clearing all caches..."
rm -rf .next .turbo dist
rm -rf node_modules/.cache
rm -rf .tsbuildinfo

echo "Removing node_modules..."
rm -rf node_modules

echo "Removing lockfile..."
rm -f pnpm-lock.yaml package-lock.json yarn.lock

echo "Reinstalling..."
pnpm install

echo "Building..."
pnpm build
```

### Dependency Conflicts

**Symptom:** Peer dependency warnings, duplicate packages

```bash
# Check for duplicates
pnpm why react  # Shows all react versions

# Find peer dependency issues
pnpm install 2>&1 | grep -i "peer"

# Check for version conflicts
pnpm ls --depth=2 | grep -E "├|└" | sort | uniq -d
```

**Resolution strategies:**

1. **Pin versions explicitly:**
```json
{
  "resolutions": {
    "react": "18.3.0",
    "@types/react": "18.3.0"
  }
}
```

2. **Use pnpm overrides:**
```json
{
  "pnpm": {
    "overrides": {
      "react": "18.3.0"
    }
  }
}
```

3. **Dedupe dependencies:**
```bash
pnpm dedupe
```

### Lockfile Issues

**Symptom:** "Lockfile out of sync" or inconsistent installs

```bash
# Verify lockfile integrity
pnpm install --frozen-lockfile

# If fails, regenerate
rm pnpm-lock.yaml
pnpm install

# Commit the new lockfile
git add pnpm-lock.yaml
```

## TypeScript Compilation Errors

### Common TS Build Errors

**`Cannot find module`:**
```bash
# Check tsconfig paths
cat tsconfig.json | grep -A 10 "paths"

# Verify path alias matches file structure
ls -la src/components  # Does this match @/components?
```

**`Declaration file not found`:**
```bash
# Check if types package exists
pnpm add -D @types/package-name

# Or create declaration file
echo "declare module 'package-name'" > src/types/package-name.d.ts
```

**`Type X is not assignable to type Y`:**
```bash
# Get detailed error
pnpm tsc --noEmit --pretty 2>&1 | head -50

# Check specific file
pnpm tsc --noEmit path/to/file.ts
```

### TSConfig Debugging

```bash
# Show resolved tsconfig
pnpm tsc --showConfig

# Trace module resolution
pnpm tsc --traceResolution > trace.txt
grep "Resolution for module" trace.txt

# Check files being compiled
pnpm tsc --listFiles
```

## Bundler-Specific Debugging

### Next.js Build Issues

```bash
# Get Next.js system info
pnpm next info

# Build with debug output
DEBUG=* pnpm next build

# Analyze bundle
ANALYZE=true pnpm build

# Build with Turbopack (may give better errors)
pnpm next build --turbo
```

**Common Next.js build errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `'use client'` directive issue | Server/client boundary | Add directive to correct file |
| Dynamic server usage | Using request in static page | Use `dynamic = 'force-dynamic'` |
| Prerender error | Error during static generation | Check data fetching, add error handling |

### Webpack/Turbopack Debugging

```javascript
// next.config.js - Enable webpack debugging
module.exports = {
  webpack: (config, { isServer }) => {
    // Log webpack config
    if (process.env.DEBUG_WEBPACK) {
      console.log('Webpack config:', JSON.stringify(config, null, 2))
    }
    return config
  },
}
```

### Vite Build Issues

```bash
# Preview mode for debugging
pnpm vite preview

# Build with verbose
pnpm vite build --debug

# Analyze dependencies
pnpm vite optimize --force
```

## Environment Configuration

### Missing Environment Variables

```bash
# Check which env vars are loaded
pnpm next build 2>&1 | grep -i "env"

# Verify .env file is being read
cat .env.local

# Check runtime vs build-time vars
# Build-time: Must be prefixed with NEXT_PUBLIC_
# Runtime: Available in server-side code only
```

### Environment Variable Debugging

```typescript
// Add to your app to debug env vars
if (process.env.NODE_ENV === 'development') {
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    // List expected env vars
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[MISSING]',
  })
}
```

### .env File Precedence

```
.env                # Default
.env.local          # Local overrides (gitignored)
.env.development    # Development mode
.env.production     # Production mode
.env.test           # Test mode
```

## CI/CD Debugging

### Reproducing CI Failures Locally

```bash
# Match CI environment
export CI=true
export NODE_ENV=production

# Use same Node version (check CI config)
nvm use 20

# Install with frozen lockfile (like CI)
pnpm install --frozen-lockfile

# Build
pnpm build
```

### Common CI-Specific Issues

| Issue | Local vs CI Difference | Fix |
|-------|----------------------|-----|
| Different Node version | Version mismatch | Pin version in CI config |
| Missing env vars | Secrets not configured | Add to CI secrets |
| Filesystem case sensitivity | macOS insensitive, Linux sensitive | Match exact casing |
| Memory limits | CI has lower limits | Increase limit or optimize |
| Network access | CI may restrict | Mock external calls |

### CI Debug Commands

```yaml
# GitHub Actions debug step
- name: Debug Build
  run: |
    echo "Node: $(node --version)"
    echo "pnpm: $(pnpm --version)"
    echo "Disk space:"
    df -h
    echo "Memory:"
    free -m || true
    echo "Environment:"
    env | grep -E "^(NODE|CI|NEXT)" | sort
```

## Memory Issues

### Out of Memory During Build

```bash
# Increase Node memory limit
NODE_OPTIONS=--max_old_space_size=8192 pnpm build

# Or in package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max_old_space_size=8192' next build"
  }
}
```

### Bundle Size Optimization

```bash
# Analyze what's in the bundle
ANALYZE=true pnpm build

# Check for large dependencies
du -sh node_modules/* | sort -rh | head -20

# Find unused dependencies
pnpm dlx depcheck
```

## Build Debugging Checklist

When build fails:

- [ ] Read the complete error message
- [ ] Clear all caches and rebuild
- [ ] Check if TypeScript compiles: `pnpm tsc --noEmit`
- [ ] Verify all dependencies installed: `pnpm install`
- [ ] Check for recent changes: `git diff HEAD~1`
- [ ] Verify environment variables are set
- [ ] Check Node.js version matches expected
- [ ] Try building in isolation (new terminal, clean env)
- [ ] Check CI logs if failing there but not locally
- [ ] Enable verbose/debug output

## Quick Fixes Reference

```bash
# Build fails mysteriously
rm -rf .next node_modules/.cache && pnpm build

# TypeScript errors not matching IDE
# Restart TS server in VSCode: Cmd+Shift+P > "TypeScript: Restart TS Server"

# Module resolution issues
pnpm install && rm -rf .next && pnpm build

# Memory issues
NODE_OPTIONS=--max_old_space_size=8192 pnpm build

# CI-specific failure
CI=true pnpm install --frozen-lockfile && pnpm build
```
