---
description: Check for hydration mismatch patterns in components
argument-hint: [component-path] (optional - searches all if omitted)
---

# Hydration Mismatch Check

**Input:** $ARGUMENTS

---

## Instructions

You are checking for hydration mismatch patterns that cause SSR/client rendering inconsistencies.

### Step 1: Determine Scope

If `$ARGUMENTS` specifies a path, focus on that component/directory.
If empty, search across `app/` and `components/` directories.

### Step 2: Launch Debugger Agent

Use the Task tool to invoke seraphae-debugger:

```
Task({
  subagent_type: "seraphae-debugger",
  prompt: `Check for hydration mismatch patterns in: ${ARGUMENTS || 'all components'}

## Common Hydration Issues to Search For

1. **Client-only APIs without guards**:
   - \`localStorage\`, \`sessionStorage\`
   - \`window\`, \`document\`, \`navigator\`
   - Pattern: Direct access without \`typeof window !== 'undefined'\`

2. **Date/Time without consistent timezone**:
   - \`new Date().toLocaleString()\` without explicit locale/timezone
   - Pattern: Date formatting that differs server vs client

3. **Random values**:
   - \`Math.random()\` for IDs
   - \`crypto.randomUUID()\` without stable seeding
   - Pattern: Dynamic IDs generated during render

4. **Conditional rendering issues**:
   - \`typeof window\` checks causing different HTML
   - Pattern: Server renders one thing, client another

5. **Invalid HTML nesting**:
   - \`<p>\` inside \`<p>\`
   - \`<div>\` inside \`<p>\`
   - Interactive elements nested incorrectly

## Search Commands
\`\`\`bash
grep -rn "localStorage\\|sessionStorage" --include="*.tsx" components/ app/
grep -rn "typeof window" --include="*.tsx" components/ app/
grep -rn "Math.random\\|randomUUID" --include="*.tsx" components/ app/
grep -rn "new Date()" --include="*.tsx" components/ app/
\`\`\`

Use skills: seraphae-context, seraphae-debugging

Output report of potential hydration issues with:
- File:line location
- Issue type
- Recommended fix pattern`
})
```

### Step 3: Present Findings

List all potential hydration issues found with fix recommendations.
