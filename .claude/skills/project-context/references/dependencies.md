# Dependencies Registry

**Package Manager:** pnpm 10.14.0+
**Node Version:** >=22.0.0

## Workspace Packages

| Package | Description |
|---------|-------------|
| `@appdistillery/web` | Next.js application |
| `@appdistillery/core` | Kernel services (auth, brain, ledger, modules) |
| `@appdistillery/database` | Supabase types + migrations |
| `@appdistillery/ui` | Shared UI components |

## Root Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| turbo | ^2.5.0 | Monorepo build orchestration |
| typescript | ^5.8.0 | Type checking |

## @appdistillery/web

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.5.6 | React framework (App Router) |
| react | ^19.1.0 | UI library |
| react-dom | ^19.1.0 | React DOM renderer |

### AI Integration
| Package | Version | Purpose |
|---------|---------|---------|
| ai | ^4.3.0 | Vercel AI SDK |
| @ai-sdk/anthropic | ^1.2.0 | Anthropic Claude provider |

### Database & Auth
| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.49.0 | Supabase client |
| @supabase/ssr | ^0.6.0 | SSR/cookie handling |

### State & Validation
| Package | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-query | ^5.67.0 | Server state management |
| zod | ^3.24.0 | Schema validation |

### Styling
| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ^4.1.0 | Utility-first CSS |
| @tailwindcss/postcss | ^4.1.0 | PostCSS plugin |
| class-variance-authority | ^0.7.1 | Component variants |
| clsx | ^2.1.1 | Classname utility |
| tailwind-merge | ^3.4.0 | Tailwind class merging |

### UI Components
| Package | Version | Purpose |
|---------|---------|---------|
| @radix-ui/react-slot | ^1.2.4 | Radix slot primitive |
| lucide-react | ^0.555.0 | Icon library |

### Development
| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^9.28.0 | Linting |
| eslint-config-next | 15.5.6 | Next.js ESLint config |
| postcss | ^8.5.4 | CSS processing |
| @types/node | ^22.10.0 | Node.js types |
| @types/react | ^19.1.0 | React types |
| @types/react-dom | ^19.1.0 | React DOM types |

## @appdistillery/core

| Package | Version | Purpose |
|---------|---------|---------|
| ai | ^4.3.0 | Vercel AI SDK |
| @ai-sdk/anthropic | ^1.2.0 | Anthropic provider |
| @supabase/supabase-js | ^2.49.0 | Supabase client |
| zod | ^3.24.0 | Schema validation |
| vitest | ^4.0.14 | Testing framework |
| @vitest/coverage-v8 | ^4.0.14 | Coverage provider |

## @appdistillery/database

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.49.0 | Supabase client |

## @appdistillery/ui

| Package | Version | Purpose |
|---------|---------|---------|
| class-variance-authority | ^0.7.1 | Component variants |
| clsx | ^2.1.1 | Classname utility |
| tailwind-merge | ^3.3.0 | Tailwind class merging |

**Peer Dependencies:**
- react ^19.0.0

## @appdistillery/agency (Module)

| Package | Version | Purpose |
|---------|---------|---------|
| @appdistillery/core | workspace:* | Core services |
| @appdistillery/database | workspace:* | Database types |
| zod | ^3.24.0 | Schema validation |
| vitest | ^4.0.14 | Testing framework |
| @vitest/coverage-v8 | ^4.0.14 | Coverage provider |

## Packages to Avoid

Check this list before installing new packages:

| Package | Alternative |
|---------|-------------|
| moment | Use native `Date` or `Intl.DateTimeFormat` |
| axios | Use native `fetch` |
| lodash (full) | Import specific functions if needed |
| uuid | Use `crypto.randomUUID()` |
| dotenv | Use Next.js built-in env handling |

## Adding Dependencies

```bash
# Add to specific workspace
pnpm --filter @appdistillery/web add <package>
pnpm --filter @appdistillery/core add -D <package>

# Add to root
pnpm add -D -w <package>
```

**Always check this registry before installing to prevent duplicates.**
