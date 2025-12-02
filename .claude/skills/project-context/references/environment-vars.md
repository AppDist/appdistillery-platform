# Environment Variables

## Overview

Environment variables are managed **per-app** following Next.js conventions:

- **Development:** `apps/web/.env.local`
- **Production:** Vercel/deployment platform
- **Template:** `.env.example` (root, committed)

**Important:** Next.js only loads `.env.local` from its own directory (`apps/web/`), not the monorepo root. This is intentional - each app owns its environment config.

## Required Variables

### NEXT_PUBLIC_SUPABASE_URL

| Property | Value |
|----------|-------|
| Type | Public (exposed to client) |
| Required | Yes |
| Format | `https://[project-id].supabase.co` |
| Purpose | Supabase project URL |

### NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

| Property | Value |
|----------|-------|
| Type | Public (exposed to client) |
| Required | Yes |
| Format | `sb_publishable_xxx` |
| Purpose | Supabase publishable API key (new format) |

**Note:** This is the new Supabase key format, not the legacy `anon` key.

### SUPABASE_SECRET_KEY

| Property | Value |
|----------|-------|
| Type | Secret (server-only) |
| Required | Yes |
| Format | `sb_secret_xxx` |
| Purpose | Supabase secret key for server operations |

**Security:** Never expose this in client-side code.

### ANTHROPIC_API_KEY

| Property | Value |
|----------|-------|
| Type | Secret (server-only) |
| Required | Yes |
| Format | `sk-ant-xxx` |
| Purpose | Anthropic Claude API access |

**Security:** Used only in `brainHandle()` on server.

### NEXT_PUBLIC_APP_URL

| Property | Value |
|----------|-------|
| Type | Public |
| Required | Yes |
| Format | URL |
| Purpose | Application base URL |
| Development | `http://localhost:3000` |
| Production | `https://your-domain.com` |

## Optional Variables (Deferred)

These are planned for future phases:

| Variable | Purpose | Phase |
|----------|---------|-------|
| SENTRY_DSN | Error tracking | Phase 3 |
| NEXT_PUBLIC_POSTHOG_KEY | Product analytics | Phase 3 |

## Environment Setup

### Development

1. Copy template to the web app directory:
   ```bash
   cp .env.example apps/web/.env.local
   ```

2. Fill in values from:
   - Supabase Dashboard → Settings → API
   - Anthropic Console → API Keys

3. Start development:
   ```bash
   pnpm dev
   ```

### Env Validation

The web app includes Zod-based validation in `apps/web/src/lib/env.ts`:

```typescript
import { clientEnv, serverEnv } from '@/lib/env';

// Type-safe access with validation at startup
const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL;
const secret = serverEnv.SUPABASE_SECRET_KEY;
```

Missing or invalid env vars will fail fast with clear Zod errors.

### Production (Vercel)

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable with appropriate scope (Production/Preview/Development)
3. Use Vercel's integration for Supabase if available

## Turbo Configuration

Environment variables are declared in `turbo.json` for proper caching:

```json
{
  "globalEnv": [
    "NODE_ENV",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "ANTHROPIC_API_KEY"
  ]
}
```

## Security Checklist

- [ ] All secrets in `.env.local` (never committed)
- [ ] `.env.local` in `.gitignore`
- [ ] Production keys never in development
- [ ] `NEXT_PUBLIC_*` prefix only for client-safe values
- [ ] Server-only secrets never imported in client components
