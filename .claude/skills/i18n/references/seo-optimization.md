# SEO Optimization Guide

Search engine optimization for multilingual luxury e-commerce.

## Hreflang Implementation

```tsx
// app/[locale]/layout.tsx
export async function generateMetadata({params}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'en': '/en',
        'ar': '/ar',
        'x-default': '/en'
      }
    }
  };
}
```

## Localized URLs

Use descriptive, localized slugs:

```typescript
// i18n/routing.ts
pathnames: {
  '/products/[slug]': {
    en: '/products/[slug]',
    ar: '/منتجات/[slug]'
  }
}
```

## Structured Data

```tsx
// components/ProductStructuredData.tsx
export function ProductStructuredData({product, locale}: {
  product: Product;
  locale: string;
}) {
  const currency = locale === 'ar' ? 'AED' : 'EUR';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock'
    }
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}}
    />
  );
}
```

## Sitemap Generation

```typescript
// app/sitemap.ts
import {routing} from '@/i18n/routing';

export default function sitemap() {
  const baseUrl = 'https://yoursite.com';
  
  return routing.locales.flatMap(locale => [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map(l => [l, `${baseUrl}/${l}`])
        )
      }
    },
    {
      url: `${baseUrl}/${locale}/products`,
      lastModified: new Date()
    }
  ]);
}
```

## Meta Tags

```tsx
export async function generateMetadata({params}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  const t = await getTranslations({locale, namespace: 'products'});
  
  return {
    title: t(`${slug}.title`),
    description: t(`${slug}.description`),
    keywords: t(`${slug}.keywords`),
    openGraph: {
      title: t(`${slug}.title`),
      description: t(`${slug}.description`),
      locale: locale === 'ar' ? 'ar_AE' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_AE'
    }
  };
}
```
