# Next.js & React Patterns

Next.js 15 and React 19 patterns for AppDistillery Platform.

## Server Components vs Client Components

**Default to Server Components** - Only use `'use client'` when needed:

```typescript
// ✅ Server Component (default) - runs on server
export default async function DashboardPage() {
  const data = await getData(); // Direct database access OK
  return <Dashboard data={data} />;
}

// ✅ Client Component - only when interactivity needed
'use client'

export function InteractiveChart({ data }: { data: ChartData }) {
  const [filter, setFilter] = useState('all');
  return <Chart data={data} filter={filter} onFilterChange={setFilter} />;
}
```

**When to use `'use client'`:**
- useState, useEffect, useRef hooks
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party client libraries

## Server Actions

All mutations go through Server Actions with `'use server'`:

```typescript
'use server'

import { getSessionContext } from '@appdistillery/core/auth';
import { revalidatePath } from 'next/cache';
import { LeadSchema } from './schemas';

export async function createLead(formData: FormData) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');

  const input = LeadSchema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
    requirements: formData.get('requirements'),
  });

  const { data, error } = await supabase
    .from('agency_leads')
    .insert({
      org_id: session.orgId,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/agency/leads');
  return data;
}
```

## Form Handling with Zod

```typescript
'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LeadIntakeSchema } from '@/modules/agency/schemas';

export function LeadForm() {
  const form = useForm({
    resolver: zodResolver(LeadIntakeSchema),
    defaultValues: { name: '', email: '', requirements: '' },
  });

  const onSubmit = async (data: z.infer<typeof LeadIntakeSchema>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    await createLead(formData);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields with shadcn/ui components */}
    </form>
  );
}
```

## shadcn/ui Component Patterns

Use shadcn/ui components with semantic tokens:

```typescript
import { Button } from '@appdistillery/ui';
import { cn } from '@/lib/utils';

// ✅ Use variant props
<Button variant="default">Primary Action</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>

// ✅ Use cn() for conditional classes
<div className={cn(
  "rounded-2xl border bg-card p-4",
  isActive && "ring-2 ring-primary",
  className
)}>
```

## Data Fetching Patterns

### Server Component Fetching

```typescript
// app/agency/leads/page.tsx
export default async function LeadsPage() {
  const session = await getSessionContext();
  if (!session) redirect('/login');

  const { data: leads } = await supabase
    .from('agency_leads')
    .select('*')
    .eq('org_id', session.orgId)
    .order('created_at', { ascending: false });

  return <LeadsList leads={leads ?? []} />;
}
```

### Client-Side with useEffect

```typescript
'use client'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLeads() {
      const { data } = await getLeads();
      if (!cancelled) {
        setLeads(data ?? []);
        setLoading(false);
      }
    }

    fetchLeads();
    return () => { cancelled = true; };
  }, []);

  return { leads, loading };
}
```

## Loading & Error States

```typescript
// app/agency/leads/loading.tsx
export default function Loading() {
  return <LeadsListSkeleton />;
}

// app/agency/leads/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-4">
      <h2>Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

## Layout Patterns

```typescript
// app/agency/layout.tsx
export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
```

## Related Documentation

For component styling patterns, see:
- `.claude/skills/design-system/SKILL.md`
