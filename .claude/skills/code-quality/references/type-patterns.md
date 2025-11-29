# TypeScript & Zod Patterns

TypeScript and Zod patterns for AppDistillery Platform.

## Zod Schema Design

Define schemas with `.describe()` for AI guidance:

```typescript
import { z } from 'zod';

// ✅ Schema with descriptions for AI
export const ScopeResultSchema = z.object({
  deliverables: z.array(z.object({
    title: z.string().describe('Short deliverable name'),
    description: z.string().describe('What will be delivered'),
    estimatedHours: z.number().describe('Estimated hours to complete'),
  })).describe('List of project deliverables'),
  timeline: z.string().describe('Suggested project timeline'),
  assumptions: z.array(z.string()).describe('Key assumptions made'),
});

// Infer TypeScript type from schema
export type ScopeResult = z.infer<typeof ScopeResultSchema>;
```

**Single source of truth:** Define schema once, infer type from it.

## Explicit Return Types

Always specify function return types:

```typescript
// ❌ BAD: Inferred return type
async function getData(id: string) {
  const result = await db.query('...');
  return result;
}

// ✅ GOOD: Explicit return type
async function getData(id: string): Promise<Lead | null> {
  const result = await db.query('...');
  return result ? mapToLead(result) : null;
}
```

## Discriminated Unions

Use discriminated unions for type-safe results:

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function createLead(input: LeadInput): Promise<Result<Lead>> {
  try {
    const lead = await db.insert(input);
    return { success: true, data: lead };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Type narrowing in usage
const result = await createLead(input);
if (result.success) {
  console.log(result.data.id); // TS knows data exists
} else {
  console.error(result.error); // TS knows error exists
}
```

## Type Guards

Create type guards for runtime checks:

```typescript
interface Lead {
  id: string;
  name: string;
  email: string;
}

interface Proposal {
  id: string;
  content: string;
  leadId: string;
}

function isLead(item: Lead | Proposal): item is Lead {
  return 'email' in item;
}

// Usage
function process(item: Lead | Proposal) {
  if (isLead(item)) {
    sendEmail(item.email); // TS knows item is Lead
  } else {
    renderProposal(item.content); // TS knows item is Proposal
  }
}
```

## Assertion Functions

Use assertions for validation:

```typescript
function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Value is null or undefined');
  }
}

// Usage
const lead = await getLead(id);
assertDefined(lead, `Lead ${id} not found`);
// TS knows lead is not null after this line
console.log(lead.name);
```

## Utility Types

```typescript
// Pick specific properties
type LeadSummary = Pick<Lead, 'id' | 'name'>;

// Omit properties
type LeadInput = Omit<Lead, 'id' | 'createdAt'>;

// Make properties optional
type PartialLead = Partial<Lead>;

// Make properties required
type RequiredLead = Required<Partial<Lead>>;

// Record for maps
type LeadsById = Record<string, Lead>;
```

## Generic API Response Type

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

function useQuery<T>(fetcher: () => Promise<T>): ApiResponse<T> {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    loading: true,
  });
  // ... implementation
  return state;
}
```

## Avoid `any`

```typescript
// ❌ BAD
function process(data: any) {
  return data.items.map((item: any) => item.name);
}

// ✅ GOOD: Define types
interface DataItem {
  id: string;
  name: string;
}

interface ProcessedData {
  items: DataItem[];
}

function process(data: ProcessedData): string[] {
  return data.items.map(item => item.name);
}
```

Use `unknown` for truly unknown data, then validate:

```typescript
function processInput(input: unknown): Lead {
  return LeadSchema.parse(input); // Zod validates at runtime
}
```

## Related Documentation

For schema patterns with brainHandle, see:
- `.claude/skills/project-context/references/module-patterns.md`
