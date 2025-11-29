# Environment Variables

Next.js provides built-in support for environment variables with special handling for client-side and server-side variables.

## Environment Files

Next.js loads environment variables from these files in order:

1. `.env.local` - Loaded in all environments, ignored by git (use for secrets)
2. `.env.development` - Development only
3. `.env.production` - Production only
4. `.env` - Default for all environments

## Creating Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
API_KEY=your_secret_api_key
```

## Server-Side Variables

All environment variables are available on the server by default:

```tsx
// Server Component or API Route
export default async function Page() {
  const dbUrl = process.env.DATABASE_URL
  const apiKey = process.env.API_KEY
  
  // Fetch data using environment variables
  const data = await fetch(`https://api.example.com/data`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  })
  
  return <div>Data loaded</div>
}
```

## Client-Side Variables

To expose variables to the browser, prefix with `NEXT_PUBLIC_`:

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ANALYTICS_ID=GA-123456
```

```tsx
// Client Component
'use client'

export function AnalyticsTracker() {
  const analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID
  
  useEffect(() => {
    // Initialize analytics
    initAnalytics(analyticsId)
  }, [])
  
  return null
}
```

## Type Safety

Define types for environment variables:

```typescript
// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string
    API_KEY: string
    NEXT_PUBLIC_API_URL: string
    NEXT_PUBLIC_ANALYTICS_ID: string
  }
}
```

## Validation with Zod

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_ANALYTICS_ID: z.string().min(1),
})

export const env = envSchema.parse(process.env)
```

Usage:

```tsx
import { env } from '@/lib/env'

const dbUrl = env.DATABASE_URL // Type-safe and validated
```

## Default Values

Provide defaults for optional variables:

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const maxRetries = parseInt(process.env.MAX_RETRIES || '3', 10)
```

## Runtime Configuration

For variables that need to be changed without rebuilding:

```typescript
// next.config.ts
const config: NextConfig = {
  env: {
    customKey: 'my-value',
  },
  publicRuntimeConfig: {
    apiUrl: process.env.API_URL,
  },
  serverRuntimeConfig: {
    apiSecret: process.env.API_SECRET,
  },
}
```

Access runtime config:

```tsx
import getConfig from 'next/config'

const { publicRuntimeConfig, serverRuntimeConfig } = getConfig()

// Available on server and client
const apiUrl = publicRuntimeConfig.apiUrl

// Only available on server
const apiSecret = serverRuntimeConfig.apiSecret
```

## Different Environments

### Development

```bash
# .env.development
DATABASE_URL=postgresql://localhost:5432/dev
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Production

```bash
# .env.production
DATABASE_URL=postgresql://prod-server:5432/prod
NEXT_PUBLIC_API_URL=https://api.production.com
```

### Testing

```bash
# .env.test
DATABASE_URL=postgresql://localhost:5432/test
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Loading Environment Variables

Environment variables are loaded automatically. To load programmatically:

```typescript
// lib/config.ts
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'

// Load additional env files
const myEnv = config({ path: '.env.custom' })
expand(myEnv)
```

## Common Patterns

### Database Connection

```typescript
// lib/db.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export default pool
```

### API Client

```typescript
// lib/api-client.ts
class ApiClient {
  private baseUrl: string
  private apiKey: string
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL!
    this.apiKey = process.env.API_KEY!
  }
  
  async get(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })
    return response.json()
  }
}

export const apiClient = new ApiClient()
```

### Feature Flags

```typescript
// lib/features.ts
export const features = {
  enableNewFeature: process.env.ENABLE_NEW_FEATURE === 'true',
  enableBetaAccess: process.env.ENABLE_BETA === 'true',
  maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
}
```

```tsx
// Usage
import { features } from '@/lib/features'

export default function Page() {
  return (
    <div>
      {features.enableNewFeature && <NewFeature />}
      {features.maintenanceMode && <MaintenanceBanner />}
    </div>
  )
}
```

## Security Best Practices

### Never Commit Secrets

```bash
# .gitignore
.env*.local
.env.local
```

### Use Separate Keys per Environment

```bash
# .env.development
API_KEY=dev_key_12345

# .env.production
API_KEY=prod_key_67890
```

### Rotate Keys Regularly

Implement key rotation for sensitive credentials:

```typescript
const apiKey = process.env[`API_KEY_V${process.env.KEY_VERSION || '1'}`]
```

### Use Secret Management

For production, use secret management services:

```typescript
// Using AWS Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

async function getSecret(secretName: string) {
  const client = new SecretsManagerClient({ region: 'us-east-1' })
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  )
  return JSON.parse(response.SecretString!)
}
```

## Deployment Platforms

### Vercel

Set environment variables in project settings:
- Dashboard → Project → Settings → Environment Variables
- Automatically loaded based on environment (Production, Preview, Development)

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build
RUN npm run build

# Runtime environment variables set when running container
CMD ["npm", "start"]
```

```bash
# Run with environment variables
docker run -e DATABASE_URL="..." -e API_KEY="..." my-app
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nextjs-app
spec:
  template:
    spec:
      containers:
      - name: nextjs
        image: my-nextjs-app
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.example.com"
```

## Troubleshooting

### Variable not loading

1. Check file name (`.env.local`, not `.env.local.txt`)
2. Restart dev server after changes
3. Verify no typos in variable names
4. Check if variable needs `NEXT_PUBLIC_` prefix

### Undefined in browser

- Server-only variables aren't accessible in client components
- Add `NEXT_PUBLIC_` prefix to expose to browser
- Verify variable is set in correct environment file

### Build-time vs Runtime

- Most variables are resolved at build time
- Use `publicRuntimeConfig` for runtime variables
- Rebuild after changing non-runtime variables

## Testing with Environment Variables

```typescript
// jest.setup.js
process.env.DATABASE_URL = 'postgresql://localhost:5432/test'
process.env.API_KEY = 'test_key'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000'
```

```typescript
// test example
import { env } from '@/lib/env'

describe('API Client', () => {
  it('uses correct API URL', () => {
    expect(env.NEXT_PUBLIC_API_URL).toBe('http://localhost:4000')
  })
})
```

## Example .env.local Template

```bash
# .env.local.example
# Copy this file to .env.local and fill in your values

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# External APIs
API_KEY=your-api-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Public variables (exposed to browser)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature flags
ENABLE_NEW_FEATURE=false
MAINTENANCE_MODE=false

# Email
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=user@example.com
EMAIL_SERVER_PASSWORD=password
EMAIL_FROM=noreply@example.com
```
