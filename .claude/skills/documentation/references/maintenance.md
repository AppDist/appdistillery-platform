# Documentation Maintenance Guide

How to keep documentation lean, DRY, and valuable over time in agentic coding environments.

---

## Maintenance Philosophy

**Documentation Debt is Real**: Outdated documentation is worse than no documentation—it misleads and wastes time.

**Context Window Hygiene**: Every byte of documentation competes for AI context. Remove what doesn't serve.

**DRY or Die**: Duplicate documentation diverges. Information should live in exactly one place.

## Regular Maintenance Schedule

### Weekly (5-10 minutes)

**Temporary Documentation Cleanup**:
```bash
# Review temporary docs older than 7 days
find docs/.tmp -name "*.md" -mtime +7

# For each folder:
# 1. Was task completed?
#    Yes → Extract insights, archive/delete folder
#    No → Still active? If not, delete
```

**Memory File Pruning**:
```bash
# Check memory.md size
wc -l .ai/memory.md

# If >300 lines:
# - Archive "Recent Changes" older than 30 days
# - Move completed tasks to archive section
# - Remove obsolete "Current State" items
```

### Monthly (30-60 minutes)

**Temporary Documentation Archive**:
```bash
# Move or delete temporary docs older than 30 days
find docs/.tmp -type d -mtime +30 -exec ls -d {} \;

# Decision tree:
# - Task completed → Extract to permanent docs, delete temp
# - Task abandoned → Delete temp docs
# - Task ongoing → Should have been completed, extract what's valuable
```

**Cross-Reference Validation**:
```bash
# Run link checker
python scripts/check_links.py docs/

# Fix broken links:
# - Update moved documents
# - Remove references to deleted content
# - Update outdated paths
```

**API Documentation Review**:
- Check against actual API (run tests)
- Update response examples if changed
- Remove deprecated endpoints
- Update error codes

**Memory File Archival**:
```markdown
# Move content >30 days old to archive section:

## Archive (Older Than 30 Days)

### 2024-12
- [Archived items here]

### 2024-11
- [Archived items here]
```

### Quarterly (2-3 hours)

**Major Cleanup**:

1. **Review all documentation**:
   ```bash
   # Find large files
   find docs -name "*.md" -size +50k
   
   # Find old files not recently updated
   find docs -name "*.md" -mtime +180
   ```

2. **Consolidate similar docs**:
   - Multiple guides on same topic → Merge
   - Repeated examples → Centralize
   - Duplicate API patterns → Create template

3. **Archive obsolete content**:
   ```bash
   mkdir -p docs/.archive/YYYY-QN
   mv docs/path/to/obsolete.md docs/.archive/2025-Q1/
   ```

4. **Update CLAUDE.md**:
   - Remove patterns no longer used
   - Add new established patterns
   - Verify accuracy of quick commands
   - Check if still under 500 lines

5. **Schema Documentation**:
   - Verify against actual schema
   - Update row counts
   - Check query performance claims
   - Document new indexes

6. **ADR Status Update**:
   - Mark superseded ADRs
   - Link to replacement ADRs
   - Archive deprecated decisions

### Annually (4-6 hours)

**Major Documentation Audit**:

1. **Delete obsolete documentation**:
   - Features removed from codebase
   - Deprecated APIs no longer in use
   - Outdated architecture diagrams

2. **Reorganize if structure has drifted**:
   - Has project architecture changed?
   - Are docs in logical locations?
   - Is directory structure still serving its purpose?

3. **Compress memory.md**:
   - Keep only last 6 months in active section
   - Archive everything older
   - Consider starting fresh if project has evolved significantly

4. **Template Review**:
   - Are templates still matching actual usage?
   - Update based on established patterns
   - Remove unused sections

## Identifying Documentation Debt

### Red Flags

**Outdated Content**:
- Code examples don't compile/run
- API docs don't match actual endpoints
- Schema docs don't match database
- Screenshots show old UI

**Duplication**:
- Same information in multiple files
- Copy-pasted code examples
- Repeated explanations

**Bloat**:
- Files over 1000 lines
- Excessive examples
- Too much hand-holding
- Obvious information documented

**Abandonment**:
- Last updated >1 year ago
- References deleted code
- Broken links everywhere
- Contradicts current implementation

### Quick Audit Questions

For any document, ask:

1. **Is it accurate?** (Verify against code/system)
2. **Is it needed?** (Would anything break without it?)
3. **Is it in the right place?** (Logical location?)
4. **Is it DRY?** (Information duplicated elsewhere?)
5. **Is it concise?** (Could it be 50% shorter?)

If any answer is "no" → Fix or delete.

## Handling Temporary Documentation

### Decision Tree

For temporary documentation older than 30 days:

```
Is the task completed?
├─ Yes
│  └─ Was anything learned that should be permanent?
│     ├─ Yes → Extract to permanent docs, delete temp
│     └─ No → Delete temp docs
└─ No
   └─ Is task still actively being worked on?
      ├─ Yes → Keep temp docs, add note about status
      └─ No → Task abandoned, delete temp docs
```

### Extraction Patterns

**When to extract from temporary docs**:

| Temporary Doc Contains | Extract To |
|------------------------|------------|
| Architecture decision | ADR in `/docs/architecture/` |
| API implementation notes | Update API docs in `/docs/api/` |
| Database design decisions | Update schema docs in `/docs/database/` |
| Useful debugging technique | Add to troubleshooting guide |
| Performance findings | Add note to relevant docs |
| Dead ends / what didn't work | Often not worth keeping |

**Extraction Example**:

```bash
# Temporary doc: docs/.tmp/2025-01-15-payment-integration/decisions.md

# Contains:
# - Why we chose Stripe over PayPal (architecture decision)
# - API endpoint designs (API documentation)
# - Database schema for payments (schema documentation)
# - Failed attempts with Braintree (probably not worth keeping)

# Extract:
# 1. Create ADR-043-stripe-integration.md
# 2. Update docs/api/payments.md
# 3. Update docs/database/payments-schema.md
# 4. Delete temporary folder
```

## Preventing Documentation Drift

### Write Tests for Documentation

**Code Examples in Docs**:
```typescript
// Extract code examples into test files
// docs/examples/api-usage.test.ts

test('API example from documentation works', async () => {
  // Exact code from documentation
  const result = await generateProposal({
    clientId: 'test-123',
    requirements: 'Build e-commerce site',
    variantCount: 3
  });
  
  expect(result).toHaveProperty('proposals');
  expect(result.proposals).toHaveLength(3);
});
```

**API Documentation**:
```bash
# Run API tests against documented endpoints
pnpm test:api

# Compare OpenAPI spec with documented endpoints
pnpm docs:validate-api
```

**Schema Documentation**:
```sql
-- Test that documented queries actually work
-- tests/sql/documented-queries.test.sql

\i docs/database/common-queries.sql

-- Verify they return expected structure
```

### Documentation as Part of Definition of Done

**For Feature PRs, require**:
- [ ] API docs updated (if API changed)
- [ ] Schema docs updated (if schema changed)
- [ ] CLAUDE.md updated (if new patterns added)
- [ ] No temporary docs older than 30 days
- [ ] Code examples tested

### Automated Checks

**Pre-commit Hook**:
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for large documentation files
large_docs=$(find docs -name "*.md" -size +100k)
if [ ! -z "$large_docs" ]; then
  echo "⚠️  Large documentation files detected:"
  echo "$large_docs"
  echo "Consider splitting these files."
fi

# Check for old temporary docs
old_temp=$(find docs/.tmp -type d -mtime +30 2>/dev/null)
if [ ! -z "$old_temp" ]; then
  echo "⚠️  Temporary docs older than 30 days:"
  echo "$old_temp"
  echo "Extract insights or delete these folders."
fi

# Check CLAUDE.md size
if [ -f "CLAUDE.md" ]; then
  lines=$(wc -l < CLAUDE.md)
  if [ $lines -gt 500 ]; then
    echo "❌ CLAUDE.md is too large ($lines lines, max 500)"
    exit 1
  fi
fi

# Check memory.md size
if [ -f ".ai/memory.md" ]; then
  lines=$(wc -l < .ai/memory.md)
  if [ $lines -gt 500 ]; then
    echo "⚠️  memory.md is large ($lines lines). Consider archiving old entries."
  fi
fi
```

**CI Check**:
```yaml
# .github/workflows/docs-check.yml
- name: Validate documentation
  run: |
    # Check for broken links
    python scripts/check_links.py docs/
    
    # Verify code examples compile
    pnpm test:docs-examples
    
    # Check API docs match OpenAPI spec
    pnpm docs:validate-api
    
    # Check for duplicate content
    python scripts/check_duplicates.py docs/
```

## Memory File Management

### Structure

```markdown
# Working Memory

## Current Focus (Last 7 Days)
- Active task: [Brief description]
- Key files being modified: [List]
- Current blockers: [If any]

## Recent Changes (Last 30 Days)
### 2025-01-15
- Completed payment integration (see ADR-043)
- Updated API docs for /api/payments

### 2025-01-10
- Started refactoring auth module
- Identified performance issues in login flow

## Pending Work
- [ ] Finish auth refactor
- [ ] Update user profile UI
- [ ] Write tests for payment flow

## Known Issues
- Database query slow on large datasets (see issue #123)
- Flaky test: user-login.test.ts

## Archive (Older Than 30 Days)
[Collapsed or in separate file]
```

### Maintenance

**Weekly**:
- Move completed tasks from "Pending Work" to "Recent Changes"
- Update "Current Focus" if changed
- Remove resolved items from "Known Issues"

**Monthly**:
- Move "Recent Changes" older than 30 days to "Archive"
- Compress "Archive" section (one line per change)
- Delete truly obsolete items

**Keep Under 500 Lines**:
```bash
# Check size
wc -l .ai/memory.md

# If too large:
# 1. Move archive to separate file: .ai/memory-archive-2025-Q1.md
# 2. Keep only last 60 days in main memory.md
# 3. Delete truly obsolete archived items
```

## CLAUDE.md Management

### What Belongs in CLAUDE.md

**Include**:
- Project context (stack, architecture)
- Essential commands (3-5 most used)
- Critical constraints (security, performance, business rules)
- Non-obvious conventions
- Links to detailed docs

**Don't Include**:
- General programming best practices
- Obvious patterns (e.g., "use TypeScript")
- Detailed API documentation (link to it)
- Examples (show in actual docs)
- Historical context (use ADRs)

### Size Limits

**Target: 300 lines, Maximum: 500 lines**

If exceeding:

1. **Move detailed content to docs**:
   ```markdown
   <!-- Before -->
   ## Database Patterns
   [500 lines of database documentation]
   
   <!-- After -->
   ## Database Patterns
   Key rules:
   - Always use org_id for multi-tenancy
   - RLS enabled on all tables
   - See [docs/database/patterns.md] for details
   ```

2. **Remove outdated content**:
   - Patterns no longer used
   - Frameworks replaced
   - Old conventions

3. **Consolidate similar sections**:
   - Multiple "coding style" sections → One section
   - Repeated patterns → Deduplicate

### Update Triggers

Update CLAUDE.md when:
- New project-wide pattern established
- Major technology change
- New critical constraint added
- Team convention changes

Don't update for:
- Minor pattern variations
- Temporary experiments
- Module-specific details
- One-off solutions

## Dealing with Documentation Accumulation

### Signs of Accumulation

- Finding information takes >5 minutes
- Multiple conflicting versions of same info
- AI agents citing outdated documentation
- New team members can't find relevant docs

### Intervention Strategy

1. **Audit Current State**:
   ```bash
   # Count documentation files
   find docs -name "*.md" | wc -l
   
   # Find largest files
   find docs -name "*.md" -exec wc -l {} \; | sort -n | tail -20
   
   # Find oldest files
   find docs -name "*.md" -printf '%T+ %p\n' | sort | head -20
   ```

2. **Categorize Documentation**:
   - Essential (delete → things break)
   - Useful (delete → inconvenient)
   - Outdated (delete → no impact)
   - Duplicate (delete → info elsewhere)

3. **Delete or Archive Aggressively**:
   ```bash
   # Create archive
   mkdir -p docs/.archive/2025-Q1-cleanup
   
   # Move outdated/duplicate docs
   mv docs/path/to/old.md docs/.archive/2025-Q1-cleanup/
   
   # Update cross-references to point to new locations
   ```

4. **Consolidate Remaining Docs**:
   - Merge similar documents
   - Create single source of truth
   - Update all references

5. **Establish Maintenance Schedule**:
   - Weekly: Temp docs cleanup
   - Monthly: Cross-reference check
   - Quarterly: Major audit
   - Annual: Full reorganization if needed

## Tools and Scripts

### Link Checker

```python
# scripts/check_links.py
# (See check_links.py in the skill)
```

### Duplicate Content Finder

```python
# scripts/check_duplicates.py
import os
import re
from difflib import SequenceMatcher

def find_similar_sections(docs_dir, similarity_threshold=0.8):
    """Find similar sections across documentation files."""
    sections = []
    
    for root, _, files in os.walk(docs_dir):
        for file in files:
            if file.endswith('.md'):
                path = os.path.join(root, file)
                with open(path) as f:
                    content = f.read()
                    # Extract sections (## heading until next ##)
                    for section in re.split(r'\n## ', content):
                        if len(section) > 200:  # Ignore very short sections
                            sections.append((path, section[:200]))
    
    # Compare sections
    duplicates = []
    for i, (path1, content1) in enumerate(sections):
        for path2, content2 in sections[i+1:]:
            similarity = SequenceMatcher(None, content1, content2).ratio()
            if similarity > similarity_threshold:
                duplicates.append((path1, path2, similarity))
    
    return duplicates

if __name__ == '__main__':
    duplicates = find_similar_sections('docs/')
    for path1, path2, similarity in duplicates:
        print(f"\n{similarity:.0%} similar:")
        print(f"  {path1}")
        print(f"  {path2}")
```

### Documentation Size Reporter

```bash
#!/bin/bash
# scripts/docs-report.sh

echo "Documentation Size Report"
echo "========================="
echo ""

echo "Total documentation files:"
find docs -name "*.md" | wc -l

echo ""
echo "Total lines of documentation:"
find docs -name "*.md" -exec wc -l {} \; | awk '{sum+=$1} END {print sum}'

echo ""
echo "Largest files:"
find docs -name "*.md" -exec wc -l {} \; | sort -rn | head -10

echo ""
echo "Oldest files (>180 days):"
find docs -name "*.md" -mtime +180 -printf '%T+ %p\n' | sort

echo ""
echo "Temporary docs older than 30 days:"
find docs/.tmp -type d -mtime +30 2>/dev/null | wc -l

echo ""
echo "CLAUDE.md size:"
wc -l CLAUDE.md

echo ""
echo "memory.md size:"
wc -l .ai/memory.md
```

## Summary

Maintain lean documentation by:

1. **Schedule regular cleanup** (weekly, monthly, quarterly, annual)
2. **Use temporary docs for task-specific work**, extract only what's valuable
3. **Test code examples** in documentation
4. **Automate checks** (pre-commit hooks, CI validation)
5. **Keep memory.md under 500 lines** (archive old entries)
6. **Keep CLAUDE.md under 500 lines** (link to detailed docs)
7. **Delete aggressively** (outdated docs are worse than no docs)
8. **Maintain single source of truth** (no duplication)
9. **Audit regularly** (quarterly major cleanup)
10. **Make maintenance part of workflow** (not a separate task)

**Remember**: Good documentation maintenance is invisible. Users find what they need quickly, AI agents get accurate context, and no one thinks about the documentation system itself.
