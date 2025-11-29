---
name: documentation
description: Use when creating, updating, or organizing documentation for AppDistillery Platform. Integrates with project-context skill for architecture/dependency updates and task-management skill for task completion documentation. Focuses on lean, DRY documentation with proper folder structure.
---

# Documentation Skill for Agentic Coding

This skill provides standards, patterns, and workflows for maintaining high-quality, context-efficient documentation in AI-assisted development projects.

## Core Philosophy

**Context is Precious**: In agentic coding, documentation competes for context window space with code, conversation history, and other skills. Every token counts.

**DRY Documentation**: Information should exist in exactly one place. Avoid duplication across files, prefer cross-references.

**Progressive Disclosure**: Structure documentation hierarchically—overview first, details on-demand.

**Temporary First, Permanent Later**: Use temporary folders for task-specific documentation, then summarize into permanent docs when tasks complete.

## Documentation Hierarchy

### 1. Project Root Documentation (Minimal)

**Purpose**: Quick orientation for new developers or AI agents.

**Files**:
- `README.md` - Project overview, quick start (max 200 lines)
- `CLAUDE.md` - AI agent context (project-specific instructions)

**Avoid**: Lengthy installation guides, detailed API docs, extensive examples.

### 2. Core Documentation (`/docs`)

**Purpose**: Permanent, curated documentation.

**Structure**:
```
/docs
├── architecture/       # ADRs, system design
├── api/               # API endpoint documentation
├── database/          # Schema documentation
└── guides/            # How-to guides (only essential ones)
```

**Rule**: Only add files here when they're needed repeatedly across multiple sessions.

### 3. Temporary Documentation (`/docs/.tmp` or `/.ai/tmp`)

**Purpose**: Task-specific documentation that may become permanent.

**Structure**:
```
/docs/.tmp  or  /.ai/tmp
├── YYYY-MM-DD-task-name/
│   ├── analysis.md       # Initial analysis
│   ├── decisions.md      # Decisions made
│   ├── implementation.md # Implementation notes
│   └── blockers.md       # Issues encountered
```

**Workflow**:
1. Create dated folder for each significant task
2. Document as you work
3. When task completes:
   - Extract permanent insights → move to `/docs`
   - Summarize key decisions → update relevant permanent docs
   - Archive or delete temporary folder

**Benefits**:
- Keeps context focused on current work
- Prevents documentation bloat
- Maintains history without cluttering main docs

### 4. Session Memory (`/.ai/memory.md` or `/.ai/sessions/`)

**Purpose**: Track project state across AI sessions.

**Content**:
```markdown
# Working Memory

## Current State
- Active task: [Brief description]
- Last modified: YYYY-MM-DD
- Key files: [List]

## Recent Changes
1. [Date] - [Change summary]
2. [Date] - [Change summary]

## Pending Work
- [ ] Task 1
- [ ] Task 2

## Known Issues
- Issue description with context
```

**Rule**: Keep this file under 500 lines. Archive older entries monthly.

## Documentation Placement Rules

### When to Document Where

| Content Type | Location | Reason |
|--------------|----------|--------|
| Architecture decisions | `/docs/architecture/adr-NNN-title.md` | Permanent reference |
| API endpoints | `/docs/api/module-name.md` | Grouped by module |
| Database schemas | `/docs/database/schema-name.md` | Technical reference |
| Task-specific analysis | `/docs/.tmp/YYYY-MM-DD-task/` | Temporary, may become permanent |
| AI agent instructions | `/CLAUDE.md` or `/.ai/instructions/` | Always loaded |
| Session state | `/.ai/memory.md` | Cross-session continuity |
| Code comments | Inline in code | Context-specific |
| Module README | `/modules/name/README.md` | Module overview only |

### What NOT to Document

**Avoid creating**:
- CHANGELOG.md (use git history)
- INSTALLATION_GUIDE.md (put in main README)
- CONTRIBUTING.md (unless multi-contributor project)
- Detailed "how it works" for standard patterns
- Step-by-step debugging logs (keep in temporary docs)
- Meeting notes (unless extracting decisions → ADR)

## Writing Standards

### Style Guidelines

**Imperative Form**: "Create a file" not "You should create"
**Present Tense**: "The API returns" not "will return"
**Active Voice**: "The system processes" not "is processed by"
**Concise**: Remove unnecessary words
**Scannable**: Use headings, lists, code blocks

### Code Examples

**Requirements**:
- Must be tested and working
- Include necessary imports
- Use realistic values
- Add brief comments for non-obvious steps
- Show expected output when helpful

**Bad Example**:
```typescript
// Too minimal
const result = api.call();
```

**Good Example**:
```typescript
import { generateProposal } from '@/modules/proposal';

// Generate 3 proposal variants for active client
const proposals = await generateProposal({
  clientId: 'client-123',
  variantCount: 3,
  requirements: 'Build e-commerce site'
});

// Returns: { proposals: [...], qUnitsUsed: 180 }
```

### Structure Patterns

**For API Documentation**: See [references/api-template.md](references/api-template.md)

**For Architecture Decisions**: See [references/adr-template.md](references/adr-template.md)

**For Database Schemas**: See [references/schema-template.md](references/schema-template.md)

## Temporary Documentation Workflow

### 1. Starting a Task

```bash
# Create temporary documentation folder
mkdir -p docs/.tmp/2025-01-15-feature-xyz

# Create initial files
touch docs/.tmp/2025-01-15-feature-xyz/{analysis,decisions,implementation}.md
```

### 2. During Implementation

Document in temporary folder:
- **analysis.md**: Problem understanding, requirements
- **decisions.md**: Design decisions with rationale
- **implementation.md**: Implementation notes, code references
- **blockers.md**: Issues encountered and resolutions

**Keep it lean**: Bullet points, code references, brief explanations.

### 3. Task Completion

**Extract permanent documentation**:

1. Review temporary docs for:
   - Architecture decisions → Create ADR
   - API changes → Update API docs
   - Schema changes → Update schema docs
   - Reusable patterns → Update guides

2. Summarize in commit message or pull request

3. Archive or delete temporary folder

**Example Extraction**:
```bash
# Temporary doc had architecture decision
cat docs/.tmp/2025-01-15-feature-xyz/decisions.md | grep "Database"
# → Create ADR: docs/architecture/adr-042-use-postgres-jsonb.md

# Temporary doc had API implementation notes
cat docs/.tmp/2025-01-15-feature-xyz/implementation.md | grep "POST"
# → Update: docs/api/proposals.md

# Archive the temporary folder
mv docs/.tmp/2025-01-15-feature-xyz docs/.archive/2025-01-15-feature-xyz
# or simply delete it: rm -rf docs/.tmp/2025-01-15-feature-xyz
```

## Context Management for AI Agents

### CLAUDE.md Best Practices

**Purpose**: Provide AI with project-specific context without bloating every conversation.

**Structure**:
```markdown
# Project Name

## Quick Reference
- Stack: Next.js 15, PostgreSQL, TypeScript
- Package manager: pnpm
- Test command: pnpm test
- Build command: pnpm build

## Key Commands
[Essential commands only]

## Architecture Notes
[Link to architecture docs, not full details]

## Code Style
[Project-specific conventions only]

## Common Patterns
[Link to pattern docs]
```

**Keep it under 500 lines**. For detailed info, reference other docs.

### .ai Directory Structure

```
.ai/
├── memory.md           # Cross-session state
├── instructions/       # Agent-specific instructions
│   ├── code-review.md
│   └── testing.md
└── tmp/               # Temporary work (same as /docs/.tmp)
    └── YYYY-MM-DD-task/
```

### Reference Files Effectively

**In SKILL.md or CLAUDE.md, use this pattern**:

```markdown
## Database Queries

For schema details, see [docs/database/schema.md](docs/database/schema.md)

**Quick reference**:
- Main tables: users, projects, tasks
- Common queries: [link to common-queries.md]
```

**Don't** copy entire schemas or API docs into context files.

## Documentation Quality Checklist

Before committing documentation:

- [ ] Is this information needed repeatedly? (If no, keep in temporary docs)
- [ ] Does this duplicate existing docs? (If yes, consolidate)
- [ ] Is this under 500 lines? (If no, split into multiple files)
- [ ] Are code examples tested? (Run them)
- [ ] Are cross-references valid? (Check links)
- [ ] Is terminology consistent? (Search for variations)
- [ ] Is this AI-context efficient? (Could Claude infer this?)

## Cross-Skill Integration

### Integration with project-context Skill

When documenting changes that affect project architecture or dependencies, update the corresponding project-context references:

| Documentation Type | Update In project-context |
|-------------------|---------------------------|
| Architecture changes | `references/architecture-map.md` |
| New dependencies | `references/dependencies.md` |
| Integration changes | `references/integration-registry.md` |
| Coding patterns | `references/module-patterns.md` |
| Environment variables | `references/environment-vars.md` |

**Key patterns to follow from project-context:**
- Use `brainHandle()` for AI operations, not direct Anthropic calls
- Use `recordUsage()` for usage tracking
- Always filter by `org_id` for tenant isolation
- Create migrations via `supabase migration new`, not Dashboard

### Integration with task-management Skill

When completing tasks that involved documentation work:

1. **Extract from temporary docs** - Follow extraction patterns:
   - Architecture decisions → Create ADR
   - API changes → Update API docs
   - Schema changes → Update schema docs

2. **Task lifecycle alignment:**
   - IN_PROGRESS → Document in temporary folder
   - REVIEW → Extract to permanent docs
   - DONE → Delete temporary folder

3. **Acceptance criteria for docs:**
   - Use Given-When-Then format for testable criteria
   - Follow SMART principles (Specific, Measurable, Achievable, Relevant, Testable)

See `.claude/skills/task-management/SKILL.md` for full task lifecycle patterns.

### AppDistillery Documentation Locations

| Content Type | Location |
|--------------|----------|
| Project context for AI | `CLAUDE.md` (max 500 lines) |
| Architecture decisions | `docs/architecture/adr-NNN-title.md` |
| API documentation | `docs/api/<module>.md` |
| Database schemas | `docs/database/<schema>.md` |
| Module documentation | `modules/<name>/README.md` |
| Temporary task docs | `docs/.tmp/YYYY-MM-DD-task/` |

## Common Patterns

### Pattern 1: Task Documentation → Permanent Docs

**Scenario**: Implementing a new feature with architecture decisions.

**Workflow**:
1. Create `/docs/.tmp/2025-01-15-payment-integration/`
2. Document as you build in temporary folder
3. When feature complete:
   - Extract ADR: `docs/architecture/adr-043-stripe-integration.md`
   - Update API docs: `docs/api/payments.md`
   - Update memory: `/.ai/memory.md` → "Completed payment integration"
4. Delete temporary folder

### Pattern 2: Subagent Task Documentation

**Scenario**: Subagent working on a specific task (e.g., refactoring module).

**Workflow**:
1. Subagent creates `/docs/.tmp/2025-01-15-refactor-auth/`
2. Subagent documents:
   - Changes made
   - Rationale
   - Testing performed
3. When task handed back:
   - Summary in PR description
   - Update module README if needed
   - Delete temporary folder

### Pattern 3: Cross-Session Continuity

**Scenario**: Multi-day feature requiring multiple AI sessions.

**Workflow**:
1. Session 1: Create temporary docs, update `/.ai/memory.md`
2. Session 2: Read memory, continue work, update temporary docs
3. Session 3: Complete feature, extract permanent docs
4. Archive temporary docs, update memory with "Completed"

## Project-Specific Customization

When using this skill in a new project:

1. **Read existing docs**: Understand current documentation patterns
2. **Identify gaps**: What's missing or duplicated?
3. **Create structure**: Set up `/docs`, `/docs/.tmp`, `/.ai` if needed
4. **Update CLAUDE.md**: Add project-specific conventions
5. **Create templates**: Adapt reference templates to project needs

For project-specific patterns, see [references/project-customization.md](references/project-customization.md)

## References

- **API Documentation Template**: [references/api-template.md](references/api-template.md)
- **ADR Template**: [references/adr-template.md](references/adr-template.md)
- **Database Schema Template**: [references/schema-template.md](references/schema-template.md)
- **Project Customization Guide**: [references/project-customization.md](references/project-customization.md)
- **Documentation Maintenance**: [references/maintenance.md](references/maintenance.md)

## Quick Start

New to this skill? Follow these steps:

1. Create documentation structure: `mkdir -p docs/{architecture,api,database} docs/.tmp .ai`
2. Create memory file: `touch .ai/memory.md`
3. Read project CLAUDE.md (or create one)
4. Start your task: `mkdir docs/.tmp/$(date +%Y-%m-%d)-task-name`
5. Document as you work
6. When done, extract permanent docs
7. Clean up temporary docs

---

**Remember**: The best documentation is the documentation that gets maintained. Keep it lean, keep it DRY, and always ask: "Does this need to be permanent?"
