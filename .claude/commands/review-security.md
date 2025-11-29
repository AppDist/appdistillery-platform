---
description: Security-focused review (Server Actions, auth patterns, data exposure)
argument-hint: [scope] (optional - reviews all Server Actions if omitted)
---

# Security Review

**Input:** $ARGUMENTS

---

## Instructions

You are invoking the seraphae-reviewer agent for security-focused analysis.

### Step 1: Identify Scope

Scope: `$ARGUMENTS`

If empty, focus on:
- `app/actions/` - All Server Actions
- `app/api/webhooks/` - Webhook handlers
- Files handling customer data

### Step 2: Launch Reviewer Agent

Use the Task tool to invoke seraphae-reviewer:

```
Task({
  subagent_type: "seraphae-reviewer",
  prompt: `Perform security-focused review for: ${ARGUMENTS || 'Server Actions and webhooks'}

## Security Checklist

### Server Actions
- [ ] Zod validation on ALL inputs
- [ ] Customer ID from session, not client input
- [ ] Authorization: Does user own this resource?
- [ ] No sensitive data in error responses
- [ ] No stack traces exposed

### Webhooks
- [ ] HMAC signature verification (Shopify, Sendcloud)
- [ ] Timing-safe comparison for signatures
- [ ] Webhook secrets from environment variables
- [ ] Failed verification returns 401

### Data Exposure
- [ ] No PII in client-side logs
- [ ] No secrets in NEXT_PUBLIC_* vars
- [ ] Service role key only in server code

### Search Commands
\`\`\`bash
# Server Actions without Zod
grep -rln "'use server'" --include="*.ts" app/actions/ | xargs grep -L "safeParse\\|z\\."

# Potential secret exposure
grep -rn "NEXT_PUBLIC_.*SECRET\\|NEXT_PUBLIC_.*KEY" --include="*.ts" --include="*.tsx"

# Customer ID from client
grep -rn "customerId.*:" --include="*.ts" app/actions/
\`\`\`

Use skills: seraphae-context, seraphae-code-quality

Focus on OWASP risks:
- A01: Broken Access Control (IDOR, missing auth)
- A03: Injection (though Drizzle parameterizes)
- A05: Security Misconfiguration

Output security findings by severity with fix recommendations.`
})
```

### Step 3: Present Findings

Show security issues with remediation guidance.

**Note**: For comprehensive security audit, use `/security-audit` instead.
