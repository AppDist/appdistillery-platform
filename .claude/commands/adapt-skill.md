---
description: Standardize skill folder structure and adapt to current project context
argument-hint: <skill-folder-path> [--shallow|--deep] [extra-context]
---

# Adapt Skill Workflow

**Input:** $ARGUMENTS

---

## Step 0: Parse Arguments

Parse the input to extract:
- **Skill path**: Path to skill folder (e.g., ".claude/skills/nextjs" or "~/.claude/skills/my-skill")
- **Adaptation mode**: `--shallow` or `--deep` (default: `--shallow`)

```
Examples:
/adapt-skill .claude/skills/nextjs                    → Shallow mode (default)
/adapt-skill .claude/skills/project-context --deep   → Deep mode
/adapt-skill .claude/skills/supabase --shallow     → Explicit shallow
/adapt-skill .claude/skills/project-context --deep Be aware of extra adaption   → Deep mode + extra context
```

---

## Phase 1: Audit Current Structure

### 1.1 Verify Skill Exists

1. Check if path exists and contains SKILL.md
2. If no SKILL.md → STOP with error "No SKILL.md found at path"

### 1.2 Inventory All Files

List all files in skill folder recursively:
```bash
find <skill-path> -type f
```

Categorize each file:
- **Root files**: Files directly in skill root
- **Reference files**: .md files (except SKILL.md)
- **Script files**: .py, .sh, executable files
- **Delete candidates**: README.md, CHANGELOG.md, INSTALLATION_GUIDE.md, QUICK_REFERENCE.md

### 1.3 Identify Violations

**Root folder rule**: SKILL.md must be the ONLY file in skill root.

Flag violations:
- [ ] Extra files in root (besides SKILL.md)
- [ ] Missing `references/` folder
- [ ] Loose .md files outside `references/`
- [ ] Loose scripts outside `scripts/`
- [ ] Files that should be deleted

### 1.4 Present Audit Report

```markdown
## Skill Audit: [skill-name]

**Path:** [skill-path]
**Mode:** [shallow/deep]

### Current Structure
[tree output]

### Violations Found
- [ ] [List each violation]

### Proposed Changes
- DELETE: [files to remove]
- MOVE to references/: [files to move]
- MOVE to scripts/: [files to move]
- CREATE: references/ (if missing)
```

---

## Phase 2: Restructure

### 2.1 Delete Unnecessary Files

Remove files not needed for skills:
```bash
rm -f README.md CHANGELOG.md INSTALLATION_GUIDE.md QUICK_REFERENCE.md
```

### 2.2 Create Required Folders

```bash
mkdir -p references/
# Only create scripts/ if scripts exist
```

### 2.3 Move Files to Correct Locations

**Reference files** → `references/`
```bash
# Move all .md files except SKILL.md
mv *.md references/  # (excluding SKILL.md)
```

**Script files** → `scripts/`
```bash
# Move all executable files
mv *.py *.sh scripts/
```

### 2.4 Update SKILL.md References

After moving files, update any internal links in SKILL.md:
- `[guide.md](guide.md)` → `[guide.md](references/guide.md)`
- `scripts/helper.py` paths should remain correct if already prefixed

### 2.5 Verify Final Structure

```
skill-name/
├── SKILL.md           # ONLY file in root
├── references/        # Required
│   └── *.md
└── scripts/           # Only if scripts exist
    └── *.py|*.sh
```

---

## Phase 3: Adapt Content

### 3.1 Shallow Mode (--shallow)

For generic technology skills (context7, nextjs, tailwindcss, shadcn, supabase).

**Actions:**
1. **Validate frontmatter**: Ensure `name` and `description` fields exist and are valid
2. **Update versions**: Check for outdated version references, update to latest stable
3. **Fix syntax**: Correct YAML frontmatter issues, markdown formatting
4. **Check line count**: If SKILL.md > 500 lines, split content to `references/`
5. **Verify links**: Ensure all internal references point to correct paths

**No project-specific changes.** Skill remains generic and reusable.

### 3.2 Deep Mode (--deep)

For project-aware skills (project-context, documentation, code-quality, debugging, git-workflow, testing).

**Step 1: Load Project Context**

Read project configuration files:
```bash
# Check for project config files
cat PROJECT_CONFIG.md 2>/dev/null
cat CLAUDE.md 2>/dev/null
cat package.json 2>/dev/null
cat tsconfig.json 2>/dev/null
```

Extract:
- Tech stack and versions
- Folder structure conventions
- Naming patterns
- Coding standards
- Project-specific workflows

**Step 2: Inject Project Context**

Update SKILL.md and references to include:
- Project's actual tech stack versions
- Project-specific folder paths
- Naming conventions used in project
- Examples using project's actual patterns
- References to project's other skills

**Step 3: Adapt Examples**

Replace generic examples with project-specific ones:
- Use actual component names from project
- Reference real folder paths
- Include project's preferred patterns

**Step 4: Cross-reference Skills**

If project has related skills, add references:
```markdown
## Related Skills
- See `code-quality` for coding standards
- See `project-context` for project architecture
```

---

## Phase 4: Validate

### 4.1 Structure Validation

- [ ] SKILL.md is ONLY file in root
- [ ] `references/` folder exists
- [ ] `scripts/` folder exists only if scripts present
- [ ] No orphaned files

### 4.2 Content Validation

- [ ] YAML frontmatter has `name` field (lowercase, hyphens, max 64 chars)
- [ ] YAML frontmatter has `description` field (non-empty, max 1024 chars)
- [ ] SKILL.md body < 500 lines
- [ ] All internal links resolve correctly
- [ ] No references to deleted files

### 4.3 Report Results

```markdown
## ✅ Skill Adapted: [skill-name]

**Mode:** [shallow/deep]

### Structure Changes
- [List files moved/deleted/created]

### Content Changes
- [List updates made]

### Validation
- ✅ Structure compliant
- ✅ Frontmatter valid
- ✅ Links verified

### Final Structure
[tree output]
```

---

## Error Handling

| Error | Resolution |
|-------|------------|
| No SKILL.md found | STOP - not a valid skill folder |
| Invalid frontmatter | Fix YAML syntax, ensure required fields |
| SKILL.md > 500 lines | Split to reference files |
| Broken internal links | Update paths after restructure |
| Deep mode, no project config | Warn user, fall back to shallow |

---

## Quick Reference

| Mode | Use For | Actions |
|------|---------|---------|
| `--shallow` | context7, nextjs, tailwindcss, shadcn, supabase, vitest | Version updates, structure fix, syntax validation |
| `--deep` | project-context, documentation, code-quality, debugging, git-workflow | + Project conventions, naming patterns, real examples |

| File Type | Destination |
|-----------|-------------|
| SKILL.md | Root (only file allowed) |
| *.md (other) | `references/` |
| *.py, *.sh | `scripts/` |
| README, CHANGELOG, etc. | DELETE |