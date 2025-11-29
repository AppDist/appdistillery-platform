# Currency & Number Formatting

Locale-aware formatting for numbers, currencies, and dates using next-intl.

## Basic Number Formatting

### Using useFormatter

```tsx
import { useFormatter } from 'next-intl';

export function FormattedNumber({ value }: { value: number }) {
  const format = useFormatter();

  return <span>{format.number(value)}</span>;
}
```

### Formatting Options

```tsx
const format = useFormatter();

// Basic number
format.number(1234.56);               // 1,234.56

// Currency
format.number(1234.56, {
  style: 'currency',
  currency: 'USD'
});                                    // $1,234.56

// Percentage
format.number(0.75, {
  style: 'percent'
});                                    // 75%

// Compact notation
format.number(1000000, {
  notation: 'compact'
});                                    // 1M
```

## Currency Display

### Basic Price Component

```tsx
import { useFormatter, useLocale } from 'next-intl';

export function Price({
  amount,
  currency = 'USD',
  showCode = false
}: {
  amount: number;
  currency?: string;
  showCode?: boolean;
}) {
  const format = useFormatter();

  return (
    <span>
      {format.number(amount, {
        style: 'currency',
        currency,
        currencyDisplay: showCode ? 'code' : 'narrowSymbol'
      })}
    </span>
  );
}
```

### Usage

```tsx
<Price amount={99.99} />                          // $99.99
<Price amount={99.99} showCode />                 // USD 99.99
<Price amount={99.99} currency="EUR" />           // €99.99
```

### Decimal Handling

Always use consistent decimal places:

```tsx
{format.number(price, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}
```

## Date & Time Formatting

### Date Formatting

```tsx
const format = useFormatter();

// Relative time
format.relativeTime(new Date());                  // "now"
format.relativeTime(new Date(Date.now() - 86400000)); // "yesterday"

// Absolute date
format.dateTime(new Date(), {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});                                               // "January 15, 2025"

// Short format
format.dateTime(new Date(), {
  dateStyle: 'short'
});                                               // "1/15/25"
```

### Time Formatting

```tsx
format.dateTime(new Date(), {
  hour: 'numeric',
  minute: 'numeric'
});                                               // "3:30 PM"

format.dateTime(new Date(), {
  timeStyle: 'short'
});                                               // "3:30 PM"
```

### Predefined Formats

Configure in `request.ts`:

```typescript
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
```

Then use:

```tsx
format.dateTime(date, 'short');  // Uses predefined format
```

## Server Components

### Using getFormatter

```typescript
import { getFormatter } from 'next-intl/server';

export default async function Page() {
  const format = await getFormatter();

  const price = format.number(1234.56, {
    style: 'currency',
    currency: 'USD'
  });

  return <p>Price: {price}</p>;
}
```

## Best Practices

1. **Store prices in cents** - Avoid float precision issues
   ```typescript
   const priceInCents = 9999;
   const displayPrice = priceInCents / 100;  // 99.99
   ```

2. **Use consistent currency** - Define currency at app level or per-locale

3. **Handle locale-specific formats** - Let Intl handle formatting
   ```typescript
   // ❌ Don't manually format
   const price = '$' + amount.toFixed(2);

   // ✅ Let next-intl handle it
   format.number(amount, { style: 'currency', currency: 'USD' });
   ```

4. **Define number formats in config** - Use predefined formats for consistency

## Common Patterns

### Cart Total

```tsx
export function CartTotal({ items }: { items: CartItem[] }) {
  const format = useFormatter();
  const t = useTranslations('cart');

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="flex justify-between font-bold">
      <span>{t('total')}</span>
      <span>
        {format.number(total, {
          style: 'currency',
          currency: 'USD'
        })}
      </span>
    </div>
  );
}
```

### Date Display

```tsx
export function PublishedDate({ date }: { date: Date }) {
  const format = useFormatter();

  return (
    <time dateTime={date.toISOString()}>
      {format.dateTime(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </time>
  );
}
```

### Relative Time

```tsx
export function TimeAgo({ date }: { date: Date }) {
  const format = useFormatter();

  return <span>{format.relativeTime(date)}</span>;
}
```
