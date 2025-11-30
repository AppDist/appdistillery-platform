---
description: Security-focused review (Server Actions, auth patterns, data exposure)
argument-hint: [scope] (optional - reviews all Server Actions if omitted)
---

# Security Review

**Input:** $ARGUMENTS

---

## Instructions

You are performing a security-focused review for the AppDistillery Platform.

### Step 1: Load Context

Load relevant skills:
```
Skill("code-quality")
Skill("project-context")
Skill("supabase")
```

### Step 2: Identify Scope

Scope: `$ARGUMENTS`

If empty, focus on high-risk areas:
- `apps/web/app/actions/` - Server Actions
- `packages/core/` - Core services
- `modules/*/actions/` - Module Server Actions
- Files handling user data

### Step 3: Security Checklist

#### Server Actions
- [ ] Zod validation on ALL inputs
- [ ] User/org ID from session, not client input
- [ ] Authorization: Does user own this resource?
- [ ] No sensitive data in error responses
- [ ] No stack traces exposed to client

#### Core Service Usage
- [ ] AI calls via `brainHandle()` only (not direct provider)
- [ ] Usage events via `recordUsage()` only
- [ ] No bypassing rate limits or quotas

#### RLS / Database
- [ ] All tenant tables have `org_id` column
- [ ] RLS policies enabled on all tables
- [ ] `org_id` filter in all queries (defense in depth)
- [ ] No raw SQL with user input

#### Data Exposure
- [ ] No PII in client-side logs
- [ ] No secrets in `NEXT_PUBLIC_*` vars
- [ ] Service role key only in server code
- [ ] Sensitive data not in error messages

### Step 4: Search for Issues

```bash
# Server Actions without Zod validation
rg "'use server'" --type ts apps/web/app/actions/ packages/core/ | xargs rg -L "safeParse|z\."

# Potential secret exposure
rg "NEXT_PUBLIC_.*SECRET|NEXT_PUBLIC_.*KEY" --type ts --type tsx

# Direct AI provider calls (should use brainHandle)
rg "import.*@ai-sdk|import.*anthropic|import.*openai" --type ts apps/ modules/

# Direct usage_events inserts (should use recordUsage)
rg "insert.*usage_events|usage_events.*insert" --type ts
```

### Step 5: OWASP Focus Areas

- **A01: Broken Access Control** - IDOR, missing auth checks
- **A02: Cryptographic Failures** - Secrets exposure
- **A03: Injection** - Though parameterized queries mitigate
- **A05: Security Misconfiguration** - Exposed endpoints

### Step 6: Output Format

```markdown
## Security Review Report

**Scope:** [files/paths reviewed]
**Risk Level:** [High/Medium/Low]

### Critical Vulnerabilities
- `file:line` - [Issue + remediation]

### High Risk Issues
- `file:line` - [Issue + remediation]

### Medium Risk Issues
- `file:line` - [Issue + remediation]

### Recommendations
1. [Prioritized security improvement]
2. [Next improvement]
```

### Step 7: Present Findings

Show security issues with specific remediation guidance.

Offer to help fix critical issues immediately.
