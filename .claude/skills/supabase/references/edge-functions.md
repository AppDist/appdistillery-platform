# Edge Functions Reference

Guide to Supabase Edge Functions for serverless backend logic.

## Overview

Edge Functions are server-side TypeScript functions deployed globally on Deno Deploy.

## Quick Start

```typescript
// supabase/functions/hello/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { name } = await req.json()
  
  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

## Invoke from Client

```typescript
const { data, error } = await supabase.functions.invoke('hello', {
  body: { name: 'World' }
})

console.log(data.message) // "Hello World!"
```

## Authentication

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  return new Response(JSON.stringify({ user }))
})
```

## Database Access

```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('author_id', user.id)

return new Response(JSON.stringify(data))
```

## CORS Configuration

```typescript
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
```

## Common Use Cases

- Webhooks
- Payment processing
- Email notifications
- Data transformations
- Third-party API integrations
- Scheduled tasks (with pg_cron)
