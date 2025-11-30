---
description: Full translation completeness audit (EN + EU languages)
argument-hint: [namespace] (optional - audits all namespaces if omitted)
---

# i18n Audit

**Input:** $ARGUMENTS

---

## Instructions

You are auditing translation completeness for the AppDistillery Platform.

### Step 1: Load Context

Load the i18n skill:
```
Skill("i18n")
```

### Step 2: Identify Scope

If `$ARGUMENTS` specifies a namespace, audit only that namespace.
If empty, audit all translation files.

### Step 3: Supported Languages

**Primary:**
- English (en) - Source language

**EU Languages (target markets):**
- Norwegian (no) - Primary target market
- Portuguese (pt) - Secondary target market

Translation files location: `apps/web/messages/`

### Step 4: Audit Checklist

#### Completeness
- [ ] All keys in `en.json` exist in other language files
- [ ] No orphaned keys (keys that exist in translations but not in source)
- [ ] Nested namespaces match structure

#### Syntax
- [ ] Valid JSON syntax in all files
- [ ] ICU message format correct (`{count, plural, ...}`)
- [ ] Rich text tags balanced (for `t.rich()`)
- [ ] No trailing commas

#### Hardcoded Strings
Search for untranslated strings in components:
```bash
# Find potential hardcoded strings in TSX
rg '"[A-Z][a-z].*"' --type tsx apps/web/ packages/ui/ modules/
rg "'[A-Z][a-z].*'" --type tsx apps/web/ packages/ui/ modules/

# Exclude common false positives
# - className strings
# - aria-* attributes with valid values
# - data-* attributes
```

#### next-intl Usage
- [ ] Components use `useTranslations()` hook
- [ ] Server components use `getTranslations()`
- [ ] Dynamic values passed correctly `t('key', { value })`
- [ ] Plural forms handled properly

### Step 5: Output Format

```markdown
## i18n Audit Report

**Scope:** [namespace or all]
**Languages:** en, no, pt

### Summary

| Language | Total Keys | Translated | Missing | Coverage |
|----------|-----------|------------|---------|----------|
| en (source) | X | X | - | 100% |
| no | X | X | X | X% |
| pt | X | X | X | X% |

### Missing Translations

#### Norwegian (no)
- `namespace.key.name` - "English value"
- `namespace.other.key` - "English value"

#### Portuguese (pt)
- `namespace.key.name` - "English value"

### Orphaned Keys
- `no.json`: `old.removed.key`

### Hardcoded Strings Found
- `file:line` - "Hardcoded string"

### ICU Syntax Issues
- `no.json:key` - Invalid plural form

### Recommendations
1. [Prioritized action items]
```

### Step 6: Present Report

Show audit results and offer to:
1. Generate missing key stubs
2. Remove orphaned keys
3. Fix syntax issues

### Adding New Language Support

To add a new EU language:
1. Create `apps/web/messages/{locale}.json`
2. Copy structure from `en.json`
3. Update `i18n.ts` config with new locale
4. Run `/i18n-audit` to verify completeness
