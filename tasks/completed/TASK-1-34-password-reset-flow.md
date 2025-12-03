---
id: TASK-1-34
title: Implement password reset flow
priority: P1-High
complexity: 3
module: web
status: COMPLETED
created: 2025-12-02
review-id: H6
fix-phase: 5
---

# TASK-1-34: Implement Password Reset Flow

## Description

No password reset flow exists. Users cannot recover their accounts if they forget their password. Implement a complete forgot/reset password flow using Supabase Auth.

## Acceptance Criteria

- [ ] User can request password reset from login page
- [ ] Reset email is sent with valid link
- [ ] User can set new password via reset link
- [ ] User is redirected to login after successful reset
- [ ] Error states handled gracefully
- [ ] Form validates password requirements

## Technical Notes

### Pages to Create

```
apps/web/src/app/(auth)/forgot-password/
├── page.tsx
└── forgot-password-form.tsx

apps/web/src/app/(auth)/reset-password/
├── page.tsx
└── reset-password-form.tsx
```

### Supabase Auth Integration

```typescript
// Request reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/reset-password`
})

// Update password (after redirect)
await supabase.auth.updateUser({
  password: newPassword
})
```

### Files to Create/Modify

- `apps/web/src/app/(auth)/forgot-password/page.tsx` - New page
- `apps/web/src/app/(auth)/forgot-password/forgot-password-form.tsx` - Form component
- `apps/web/src/app/(auth)/reset-password/page.tsx` - New page
- `apps/web/src/app/(auth)/reset-password/reset-password-form.tsx` - Form component
- `apps/web/src/app/(auth)/login/login-form.tsx` - Add forgot password link

### Patterns to Follow

- Use react-hook-form with zodResolver
- Follow existing auth form patterns
- Use shadcn/ui form components
- Handle loading and error states
- Add proper accessibility attributes

## Implementation Agent

- **Implement**: `ux-ui`
- **Review**: `appdistillery-developer`, `code-reviewer`

## Execution

- **Mode**: Sequential
- **Phase**: Fix Phase 5 (UX & Documentation)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding H6 |
