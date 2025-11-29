# Configuration Guide

Complete setup for i18n with Next.js 15+ and next-intl 4.x+.

## Initial Setup

### 1. Install Dependencies

```bash
pnpm add next-intl
```

### 2. Configure Next.js

```typescript
// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Your other Next.js config
};

export default withNextIntl(nextConfig);
```

### 3. Configure Locales

```typescript
// src/i18n/config.ts
export const locales = ['en'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

// Add more locales as needed:
// export const locales = ['en', 'de', 'fr', 'es'] as const;
```

### 4. Configure Routing

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,

  // 'as-needed': hide default locale from URL
  // English: /products  German: /de/products
  localePrefix: 'as-needed',

  // Optional: localized pathnames for SEO
  pathnames: {
    '/': '/',
    '/dashboard': '/dashboard',
    '/settings': '/settings',
  },

  // Optional: locale cookie
  localeCookie: {
    name: 'APP_LOCALE',
    maxAge: 31536000, // 1 year
    sameSite: 'lax'
  }
});
```

### 5. Configure Middleware

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
```

### 6. Configure Request

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { hasLocale } from 'next-intl';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,

    // Timezone (adjust as needed)
    timeZone: 'UTC',

    // Formatting defaults
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }
      },
      number: {
        currency: {
          style: 'currency',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      }
    }
  };
});
```

### 7. Configure Navigation

```typescript
// src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
  permanentRedirect
} = createNavigation(routing);
```

## App Structure

### Root Layout

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | AppName',
    default: 'AppName'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

### Locale Layout

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

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

### Example Page

```typescript
// src/app/[locale]/page.tsx
import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';

export default function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations('home');

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </main>
  );
}
```

## Message Files Structure

### English Messages

```json
// messages/en.json
{
  "metadata": {
    "title": "AppName",
    "description": "Application description"
  },
  "home": {
    "title": "Welcome",
    "description": "Get started with your application"
  },
  "nav": {
    "home": "Home",
    "dashboard": "Dashboard",
    "settings": "Settings"
  },
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "tryAgain": "Try Again",
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

## TypeScript Configuration

```typescript
// src/types/i18n.d.ts
import { routing } from '@/i18n/routing';

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
  }
}
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

## Adding a New Language

### Step 1: Update Config

```typescript
// src/i18n/config.ts
export const locales = ['en', 'de'] as const;  // Add new locale
```

### Step 2: Create Messages File

```bash
cp messages/en.json messages/de.json
```

### Step 3: Translate

Edit `messages/de.json` with translations.

### Step 4 (Optional): Add Localized Pathnames

```typescript
// src/i18n/routing.ts
pathnames: {
  '/dashboard': {
    en: '/dashboard',
    de: '/dashboard'  // Or '/armaturenbrett' for localized URL
  }
}
```

## Verification Checklist

- [ ] next-intl installed
- [ ] Config file created with locales
- [ ] Routing configuration created
- [ ] Middleware configured
- [ ] Request configuration setup
- [ ] Navigation helpers created
- [ ] Message files created
- [ ] TypeScript types defined
- [ ] Locale layout with setRequestLocale

## Common Issues

**Messages not loading**
- Verify import path in `request.ts` matches your messages directory

**Static generation failing**
- Ensure `setRequestLocale()` is called in all pages and layouts

**TypeScript errors**
- Create `i18n.d.ts` file with proper type declarations

**Locale not detected**
- Check middleware matcher pattern
- Verify locale is in the `locales` array
