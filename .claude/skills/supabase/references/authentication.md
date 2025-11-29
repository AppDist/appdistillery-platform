# Authentication Reference

Complete authentication patterns for Supabase including all supported methods and flows.

## Table of Contents

- Email/Password Authentication
- Magic Link (Passwordless)
- OAuth Providers
- Phone/SMS Authentication
- Anonymous Authentication
- Session Management
- SSR Authentication Patterns

## Email/Password Authentication

### Sign Up

**JavaScript:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      full_name: 'John Doe',
      age: 27
    }
  }
})
```

**Python:**
```python
response = supabase.auth.sign_up({
    'email': 'user@example.com',
    'password': 'secure-password',
    'options': {
        'data': {
            'full_name': 'John Doe',
            'age': 27
        }
    }
})
```

### Sign In

**JavaScript:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})

if (error) throw error
console.log('User:', data.user)
console.log('Session:', data.session)
```

**Python:**
```python
response = supabase.auth.sign_in_with_password({
    'email': 'user@example.com',
    'password': 'secure-password'
})

if response.user:
    print(f"Logged in as: {response.user.email}")
```

### Password Reset

**Step 1: Request Reset Link**

**JavaScript:**
```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://yourapp.com/reset-password'
  }
)
```

**Python:**
```python
response = supabase.auth.reset_password_for_email(
    'user@example.com',
    {
        'redirect_to': 'https://yourapp.com/reset-password'
    }
)
```

**Step 2: Update Password**

After user clicks reset link:

**JavaScript:**
```typescript
const { data, error } = await supabase.auth.updateUser({
  password: 'new-secure-password'
})
```

**Python:**
```python
response = supabase.auth.update_user({
    'password': 'new-secure-password'
})
```

## Magic Link (Passwordless Authentication)

Send authentication link via email - no password required.

### Send Magic Link

**JavaScript:**
```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://yourapp.com/auth/callback'
  }
})

if (!error) {
  alert('Check your email for the login link!')
}
```

**Python:**
```python
response = supabase.auth.sign_in_with_otp({
    'email': 'user@example.com',
    'options': {
        'email_redirect_to': 'https://yourapp.com/auth/callback'
    }
})
```

### Verify OTP Token Hash (PKCE Flow)

For SSR applications using PKCE flow:

**JavaScript:**
```typescript
const { error } = await supabase.auth.verifyOtp({
  token_hash: 'hash-from-url',
  type: 'email'
})
```

## OAuth Providers

Social login with Google, GitHub, Facebook, etc.

### Available Providers

- google
- github
- facebook
- twitter
- discord
- gitlab
- bitbucket
- azure
- slack
- spotify
- apple
- linkedin
- notion
- twitch
- zoom
- workos

### Sign In with OAuth

**JavaScript:**
```typescript
// Browser redirect flow
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourapp.com/auth/callback',
    scopes: 'email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  }
})
```

**Python:**
```python
# Python typically used for backend operations
# OAuth flow is primarily browser-based
response = supabase.auth.sign_in_with_oauth({
    'provider': 'google',
    'options': {
        'redirect_to': 'https://yourapp.com/auth/callback'
    }
})
```

### OAuth with PKCE (Server-Side)

**JavaScript:**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourapp.com/auth/callback',
    skipBrowserRedirect: true  // For mobile/custom flows
  }
})

// Use data.url to open OAuth flow in external browser
```

### OAuth Callback Handler

Handle the OAuth callback in your application:

**Next.js Example:**
```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

## Phone/SMS Authentication

Authenticate users via SMS OTP.

### Send SMS OTP

**JavaScript:**
```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+1234567890',
  options: {
    channel: 'sms'  // or 'whatsapp' if configured
  }
})
```

**Python:**
```python
response = supabase.auth.sign_in_with_otp({
    'phone': '+1234567890',
    'options': {
        'channel': 'sms'
    }
})
```

### Verify SMS OTP

**JavaScript:**
```typescript
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+1234567890',
  token: '123456',
  type: 'sms'
})
```

**Python:**
```python
response = supabase.auth.verify_otp({
    'phone': '+1234567890',
    'token': '123456',
    'type': 'sms'
})
```

## Anonymous Authentication

Create temporary sessions that can later be converted to permanent accounts.

### Sign In Anonymously

**JavaScript:**
```typescript
const { data, error } = await supabase.auth.signInAnonymously()

console.log('Anonymous user:', data.user.id)
```

**Python:**
```python
response = supabase.auth.sign_in_anonymously()
```

### Link Identity to Anonymous User

Convert anonymous account to permanent:

**Link Email:**
```typescript
// First, update email
const { data, error } = await supabase.auth.updateUser({
  email: 'user@example.com'
})

// User receives verification email
// After verification, set password
await supabase.auth.updateUser({
  password: 'secure-password'
})
```

**Link OAuth:**
```typescript
const { data, error } = await supabase.auth.linkIdentity({
  provider: 'google'
})
```

**Python:**
```python
# Link email
response = supabase.auth.update_user({
    'email': 'user@example.com'
})

# Link OAuth
response = supabase.auth.link_identity({
    'provider': 'google'
})
```

## Session Management

### Get Current Session

**JavaScript:**
```typescript
const { data: { session }, error } = await supabase.auth.getSession()

if (session) {
  console.log('Access token:', session.access_token)
  console.log('User:', session.user)
}
```

**Python:**
```python
session = supabase.auth.get_session()
if session:
    print(f"User: {session.user.email}")
```

### Get Current User

**JavaScript:**
```typescript
// Validates JWT and fetches user from auth server
const { data: { user }, error } = await supabase.auth.getUser()
```

**Python:**
```python
user = supabase.auth.get_user()
```

### Refresh Session

Sessions automatically refresh, but you can manually trigger:

**JavaScript:**
```typescript
const { data, error } = await supabase.auth.refreshSession()
```

**Python:**
```python
response = supabase.auth.refresh_session()
```

### Sign Out

**JavaScript:**
```typescript
const { error } = await supabase.auth.signOut()
```

**Python:**
```python
supabase.auth.sign_out()
```

### Listen to Auth State Changes

**JavaScript:**
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth event:', event)
    console.log('Session:', session)
    
    switch (event) {
      case 'SIGNED_IN':
        console.log('User signed in')
        break
      case 'SIGNED_OUT':
        console.log('User signed out')
        break
      case 'TOKEN_REFRESHED':
        console.log('Token refreshed')
        break
      case 'USER_UPDATED':
        console.log('User updated')
        break
    }
  }
)

// Clean up subscription
subscription.unsubscribe()
```

## Update User Metadata

**JavaScript:**
```typescript
const { data, error } = await supabase.auth.updateUser({
  data: {
    full_name: 'Jane Doe',
    avatar_url: 'https://example.com/avatar.jpg'
  }
})
```

**Python:**
```python
response = supabase.auth.update_user({
    'data': {
        'full_name': 'Jane Doe',
        'avatar_url': 'https://example.com/avatar.jpg'
    }
})
```

## SSR Authentication Patterns

For server-side rendering, see [ssr-patterns.md](ssr-patterns.md) for:

- Cookie-based session storage
- Middleware setup for token refresh
- Server and client component patterns
- PKCE flow implementation

## Security Best Practices

1. **Email Verification**: Enable "Confirm email" in project settings for production
2. **Password Strength**: Enforce minimum requirements (8+ characters, mixed case, numbers)
3. **Rate Limiting**: Supabase has built-in rate limits for auth endpoints
4. **Redirect URLs**: Configure allowed redirect URLs in project settings
5. **JWT Expiry**: Configure token expiry in project auth settings (default: 1 hour)
6. **Refresh Tokens**: Never expires, can only be used once
7. **MFA**: Enable multi-factor authentication for sensitive applications

## Common Patterns

### Protected Route Pattern

**React:**
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div>Loading...</div>
  if (!session) return <Navigate to="/login" />
  
  return children
}
```

### Login Form Pattern

**React:**
```typescript
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Sign In'}
      </button>
    </form>
  )
}
```

## Troubleshooting

**Issue**: "Email not confirmed"
- Check if email confirmation is enabled in project settings
- Resend confirmation email

**Issue**: "Invalid login credentials"
- Verify email/password are correct
- Check if user exists in auth.users table

**Issue**: OAuth redirect not working
- Verify redirect URL is in allowed list
- Check callback route is properly configured

**Issue**: Session expires too quickly
- Adjust JWT expiry in project auth settings
- Implement refresh logic with `onAuthStateChange`

**Issue**: Magic link not received
- Check spam folder
- Verify email provider settings
- Check Supabase SMTP configuration
