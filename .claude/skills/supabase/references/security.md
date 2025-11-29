# Security Best Practices

Comprehensive security guidelines for Supabase applications.

## API Keys

### Never Expose Service Role Key

```typescript
// ❌ NEVER do this in client-side code
const supabase = createClient(url, SERVICE_ROLE_KEY)

// ✅ Use anon key for client-side
const supabase = createClient(url, ANON_KEY)
```

Service role key bypasses all RLS policies - only use in backend.

### Environment Variables

```bash
# .env.local (never commit)
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...  # Safe for client
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Backend only!
```

## Row Level Security (RLS)

### Enable RLS on All Tables

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
```

### Common RLS Patterns

**Own data only:**
```sql
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);
```

**Public read, authenticated write:**
```sql
CREATE POLICY "Public can read posts"
ON posts FOR SELECT
TO public
USING (published = true);

CREATE POLICY "Authenticated can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);
```

**Role-based access:**
```sql
CREATE POLICY "Admins can do anything"
ON posts
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
```

## Authentication Security

### Email Verification

Enable in Dashboard > Authentication > Email Auth > Confirm email

### Password Requirements

```typescript
// Implement client-side validation
function validatePassword(password: string) {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*]/.test(password)

  return password.length >= minLength &&
         hasUpperCase &&
         hasLowerCase &&
         hasNumbers
}
```

### Rate Limiting

Supabase has built-in rate limits:
- 30 requests per hour for email/password operations
- 10 requests per hour for email confirmations

### MFA (Multi-Factor Authentication)

```typescript
// Enable MFA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
})

// Verify
const { data, error } = await supabase.auth.mfa.verify({
  factorId: data.id,
  challengeId: data.challenge_id,
  code: '123456'
})
```

## Storage Security

```sql
-- Folder-based access
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- File size limits
ALTER TABLE storage.objects
ADD CONSTRAINT file_size_limit
CHECK (size < 10485760); -- 10MB
```

## Function Security

```typescript
// Validate input
serve(async (req) => {
  const { email } = await req.json()
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response('Invalid email', { status: 400 })
  }
  
  // Process...
})
```

## SQL Injection Prevention

Supabase client handles parameterization automatically:

```typescript
// ✅ Safe - automatically parameterized
const { data } = await supabase
  .from('users')
  .select()
  .eq('email', userInput)

// ❌ Don't use raw SQL with user input
await supabase.rpc('custom_function', { raw_sql: userInput })
```

## HTTPS Only

Always use HTTPS in production. Supabase enforces this automatically.

## CORS Configuration

Configure allowed origins in Dashboard > API > CORS settings.

## Audit Logging

```sql
-- Enable audit trail
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Trigger for audit
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Service role key never in client code
- [ ] Email verification enabled
- [ ] Strong password requirements
- [ ] HTTPS only in production
- [ ] CORS properly configured
- [ ] Input validation on all user data
- [ ] Proper error handling (don't leak info)
- [ ] Storage policies configured
- [ ] Regular security audits
- [ ] Database backups enabled
- [ ] Monitor auth logs for suspicious activity

## Common Vulnerabilities to Avoid

1. **Exposed Service Role Key**
2. **Missing RLS policies**
3. **SQL injection in RPC functions**
4. **Overly permissive CORS**
5. **No input validation**
6. **Verbose error messages**
7. **Unvalidated redirects**
8. **Missing rate limiting on custom functions**
