---
description: Full translation completeness audit (EN/AR)
argument-hint: [namespace] (optional - audits all namespaces if omitted)
---

# i18n Audit

**Input:** $ARGUMENTS

---

## Instructions

You are invoking the seraphae-i18n-auditor agent for translation completeness.

### Step 1: Identify Scope

Namespace: `$ARGUMENTS`

If empty, audit all namespaces in `/messages/en.json` and `/messages/ar.json`.

### Step 2: Launch i18n Auditor Agent

Use the Task tool to invoke seraphae-i18n-auditor:

```
Task({
  subagent_type: "seraphae-i18n-auditor",
  prompt: `Perform translation completeness audit for: ${ARGUMENTS || 'all namespaces'}

## Audit Workflow

### Phase 1: Discovery
1. Read /messages/en.json and /messages/ar.json
2. Identify all namespaces and key counts
3. Load seraphae-i18n skill if available

### Phase 2: Completeness Analysis
1. Build key diff (recursively for nested objects):
   - missing_in_ar: Keys in EN but not AR
   - missing_in_en: Keys in AR but not EN (orphaned)
   - present_in_both: Keys in both files

2. For present_in_both, detect:
   - Untranslated (identical to English, excluding brand terms)
   - Interpolation mismatches ({name}, {count}, {date})

3. Check ICU message syntax validity

### Phase 3: Technical Validation
- Validate ICU plural forms (Arabic needs 6: zero, one, two, few, many, other)
- Check t.rich() tag consistency (<bold>, <link>)
- Detect hardcoded strings in components using useTranslations

## Preserved Terms (NOT flagged as untranslated)
- "Seraphaé" - brand name
- Product line names
- Numbers and prices

Use skills: seraphae-context, seraphae-i18n

## Output Format

\`\`\`markdown
## Seraphaé i18n Audit Report

### Summary
- Total EN keys: X
- Total AR keys: Y
- Missing in AR: Z (X%)
- Orphaned in AR: N

### 🔴 Critical (Must Fix)
[Missing keys, broken ICU syntax]

### 🟡 Warnings
[Untranslated strings, placeholder mismatches]

### Missing Translation Keys
| Namespace | Key | English Value |
\`\`\``
})
```

### Step 3: Present Audit Report

Show translation gaps with prioritized action items.
