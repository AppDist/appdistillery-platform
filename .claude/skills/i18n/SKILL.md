---
name: i18n
description: Internationalization (i18n) for Next.js 15+ applications using next-intl. Provides patterns for multi-language support with no hardcoded values, easy language additions, and proper translation workflows. Use when implementing translations, adding new languages, or setting up i18n infrastructure. Focuses on scalable architecture that starts with English but supports any LTR language. (project)
---

# Internationalization with next-intl

Scalable i18n setup for Next.js 15+ using next-intl. Designed for English-first development with easy expansion to additional languages.

## Stack

- **Next.js 15+** (App Router)
- **next-intl 4.x+** (latest stable)
- **TypeScript** for type-safe translations

## Core Principles

1. **No hardcoded strings** - All user-facing text in translation files
2. **English-first** - Start with English, add languages as needed
3. **Type-safe keys** - TypeScript ensures translation key validity
4. **Scalable structure** - Easy to add new languages without code changes

## Project Structure

```
src/
├── app/
│   └── [locale]/           # Dynamic locale segment
│       ├── layout.tsx
│       └── page.tsx
├── i18n/
│   ├── config.ts           # Locale configuration
│   ├── request.ts          # Server-side i18n setup
│   └── navigation.ts       # Localized navigation helpers
└── messages/
    ├── en.json             # English translations
    └── {locale}.json       # Additional languages
```

## Setup

### 1. Install Dependencies

```bash
pnpm add next-intl
```

### 2. Configure Locales

```typescript
// src/i18n/config.ts
export const locales = ['en'] as const;  // Add languages here: ['en', 'de', 'fr']
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];
```

### 3. Create Request Config

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### 4. Update next.config.ts

```typescript
// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  // your config
};

export default withNextIntl(nextConfig);
```

### 5. Create Middleware

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',  // No prefix for default locale
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

### 6. Create Root Layout

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## Translation Files

### Structure

```json
// src/messages/en.json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Try again",
    "save": "Save",
    "cancel": "Cancel"
  },
  "nav": {
    "home": "Home",
    "dashboard": "Dashboard",
    "settings": "Settings"
  },
  "auth": {
    "signIn": "Sign in",
    "signOut": "Sign out",
    "email": "Email address",
    "password": "Password"
  }
}
```

### Namespace Convention

Organize by feature/domain:
- `common` - Shared UI strings
- `nav` - Navigation
- `auth` - Authentication
- `{module}` - Module-specific (e.g., `agency`, `proposals`)

## Usage Patterns

### Server Components (Recommended)

```typescript
// In Server Components
import { getTranslations } from 'next-intl/server';

export default async function Dashboard() {
  const t = await getTranslations('nav');

  return <h1>{t('dashboard')}</h1>;
}
```

### Client Components

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function SaveButton() {
  const t = useTranslations('common');

  return <button>{t('save')}</button>;
}
```

### With Variables

```json
{
  "greeting": "Hello, {name}!",
  "items": "You have {count, plural, =0 {no items} =1 {1 item} other {# items}}"
}
```

```typescript
const t = useTranslations();
t('greeting', { name: 'User' });  // "Hello, User!"
t('items', { count: 5 });         // "You have 5 items"
```

### Rich Text / HTML

```json
{
  "terms": "By signing up, you agree to our <link>Terms of Service</link>."
}
```

```typescript
t.rich('terms', {
  link: (chunks) => <a href="/terms">{chunks}</a>,
});
```

## Navigation

### Create Navigation Helpers

```typescript
// src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
});
```

### Use Localized Links

```typescript
import { Link } from '@/i18n/navigation';

// Automatically handles locale
<Link href="/dashboard">Dashboard</Link>
```

## Adding a New Language

### Step 1: Update Config

```typescript
// src/i18n/config.ts
export const locales = ['en', 'de'] as const;  // Add 'de'
```

### Step 2: Create Translation File

```bash
cp src/messages/en.json src/messages/de.json
```

### Step 3: Translate Content

```json
// src/messages/de.json
{
  "common": {
    "loading": "Wird geladen...",
    "error": "Ein Fehler ist aufgetreten",
    "save": "Speichern"
  }
}
```

That's it! The middleware and routing automatically handle the new locale.

## Type Safety

### Generate Types (Optional)

```typescript
// src/i18n/types.ts
import en from '@/messages/en.json';

type Messages = typeof en;

declare global {
  interface IntlMessages extends Messages {}
}
```

This enables autocomplete for translation keys.

## Best Practices

### DO:
- Keep all user-facing strings in translation files
- Use namespaces to organize translations
- Use variables for dynamic content
- Keep keys descriptive: `auth.signInButton` not `auth.btn1`

### DON'T:
- Hardcode strings in components
- Use English text as keys: `t('Sign in')` ❌
- Concatenate translated strings: `t('hello') + ' ' + t('world')` ❌
- Translate inside loops unnecessarily

## Common Patterns

### Metadata (Page Titles)

```typescript
// src/app/[locale]/dashboard/page.tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    title: t('dashboard.title'),
    description: t('dashboard.description'),
  };
}
```

### Form Validation Messages

```json
{
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email",
    "minLength": "Must be at least {min} characters"
  }
}
```

### Error Messages

```typescript
// Centralize error translations
const t = await getTranslations('errors');

try {
  await action();
} catch (error) {
  return { error: t('somethingWentWrong') };
}
```

## References

For detailed information:
- [Configuration Options](references/configuration.md)
- [Translation Workflow](references/translation-workflow.md)
- [Currency & Number Formatting](references/currency-formatting.md)
- [SEO Optimization](references/seo-optimization.md)
- [QA Checklist](references/qa-checklist.md)
