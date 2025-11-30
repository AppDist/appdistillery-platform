# Claude Code Reference Index

Quick reference for available agents, skills, and commands.
For details, see individual files in `.claude/agents/`, `.claude/skills/`, `.claude/commands/`.

## Agents (10)

| Agent | Model | Purpose |
|-------|-------|---------|
| [strategic-advisor](agents/strategic-advisor.md) | Opus | Planning, task decomposition, architecture decisions |
| [appdistillery-developer](agents/appdistillery-developer.md) | Sonnet | Backend, Server Actions, Core kernel |
| [ux-ui](agents/ux-ui.md) | Opus | Frontend components, styling, accessibility |
| [test-engineer](agents/test-engineer.md) | Sonnet | TDD workflow, test writing |
| [database-architect](agents/database-architect.md) | Opus | Schema design, migrations, RLS |
| [security-auditor](agents/security-auditor.md) | Opus | Threat modeling, RLS verification |
| [code-reviewer](agents/code-reviewer.md) | Opus | Iterative review, pattern guidance |
| [documentation-writer](agents/documentation-writer.md) | Sonnet | API docs, ADRs |
| [performance-analyst](agents/performance-analyst.md) | Opus | N+1 detection, bundle analysis |
| [architecture-advisor](agents/architecture-advisor.md) | Opus | Module boundaries, tech debt |

## Skills (14)

| Skill | Purpose |
|-------|---------|
| [project-context](skills/project-context/) | AppDistillery architecture reference |
| [code-quality](skills/code-quality/) | Best practices for the stack |
| [supabase](skills/supabase/) | Database, auth, RLS patterns |
| [testing](skills/testing/) | Vitest, Playwright, RTL |
| [nextjs](skills/nextjs/) | Next.js 15, App Router, RSC |
| [design-system](skills/design-system/) | Tokens, Tailwind v4, shadcn |
| [shadcn](skills/shadcn/) | Component installation, theming |
| [tailwindcss](skills/tailwindcss/) | Tailwind v4 utilities |
| [debugging](skills/debugging/) | Systematic debugging workflow |
| [documentation](skills/documentation/) | Doc patterns, ADRs |
| [task-management](skills/task-management/) | Task lifecycle |
| [ai-llm-setup](skills/ai-llm-setup/) | AI provider integration |
| [i18n](skills/i18n/) | Internationalization |
| [context7](skills/context7/) | External library docs |

## Commands (14)

| Command | Purpose |
|---------|---------|
| `/execute-task <id>` | Execute tasks with workflow |
| `/review [scope]` | Pre-merge code review |
| `/review-security [scope]` | Security-focused review |
| `/test [scope]` | Run tests, diagnose failures |
| `/debug <error>` | FOCUS debugging analysis |
| `/build-fail` | Analyze build failures |
| `/migration-new <name>` | Create Supabase migration |
| `/migration-review [file]` | Review pending migrations |
| `/module-new <name>` | Create new module |
| `/adr <title>` | Create ADR |
| `/i18n-audit [ns]` | Translation audit |
| `/hydration [path]` | Check hydration issues |
| `/subagent` | Design/adapt subagents |
| `/adapt-skill <path>` | Adapt skill to project |

## Orchestration Patterns

### Main Agent as Orchestrator

The default Claude agent acts as **orchestrator**, delegating specialized work to agents in `.claude/agents/`. Complex tasks should be broken down and delegated to appropriate specialists.

### Parallel Agent Execution

Launch independent agents in a single message for parallel work:
- Multiple Explore agents for different parts of codebase
- Implementation + Testing after planning is complete
- Frontend + Backend when they don't depend on each other

### Explore Agent for Context

During planning, use `Explore` agent to gather codebase context before implementation:
- Find similar patterns
- Identify files to modify
- Understand existing implementations

### Agent Selection Guide

| Need | Primary Agent | Support |
|------|---------------|---------|
| Backend implementation | appdistillery-developer | test-engineer, database-architect |
| Frontend/UI work | ux-ui | test-engineer |
| Database changes | database-architect | security-auditor |
| Write tests | test-engineer | appdistillery-developer |
| Security review | security-auditor | code-reviewer |
| Code quality | code-reviewer | - |
| Performance issues | performance-analyst | - |
| Architecture questions | architecture-advisor | strategic-advisor |
| Planning/decomposition | strategic-advisor | - |
| Documentation | documentation-writer | - |
