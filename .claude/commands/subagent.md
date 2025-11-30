---
description: Design and specify subagents for Claude Code with full project context awareness
argument-hint: --new <agent-type> <goal> | --adapt <agent-name> [review|update|refine]
---

# Describe Agent Workflow

**Input:** $ARGUMENTS

---

## Step 0: Parse Arguments

Parse the input to extract mode and parameters:

- **Mode**: `--new` or `--adapt` (required)
- **For --new**: `<agent-type>` and `<goal>` (both required)
- **For --adapt**: `<agent-name>` and optional `[review|update|refine]` (default: `review`)

```
Examples:
/describe-agent --new code-reviewer "Review TypeScript code for security and best practices"
/describe-agent --new debugger "Diagnose and fix runtime errors in Next.js applications"
/describe-agent --adapt security-auditor review
/describe-agent --adapt documentation-writer update
/describe-agent --adapt test-runner refine
```

**Validation:**
- If no mode provided → STOP with error "Please specify --new or --adapt"
- If --new without type/goal → STOP with error "Usage: --new <agent-type> <goal>"
- If --adapt without agent-name → STOP with error "Usage: --adapt <agent-name> [review|update|refine]"

---

## Phase 1: Context Discovery

### 1.1 Load Project Configuration

Read project context files to understand the environment:

```bash
# Check for project config files
cat CLAUDE.md 2>/dev/null
cat .claude/settings.json 2>/dev/null
cat package.json 2>/dev/null
cat tsconfig.json 2>/dev/null
```

Extract and note:
- **Tech stack**: Framework, language, versions
- **Project type**: Web app, API, CLI, library, etc.
- **Conventions**: Naming patterns, folder structure
- **Testing approach**: Test framework, coverage requirements
- **CI/CD**: Deployment pipeline, quality gates

### 1.2 Inventory Available Skills

List all skills in the project:

```bash
# Project skills
find .claude/skills -name "SKILL.md" -type f 2>/dev/null | head -20

# User skills (if relevant)
find ~/.claude/skills -name "SKILL.md" -type f 2>/dev/null | head -10
```

For each skill found, extract:
- **Name**: From frontmatter or folder name
- **Description**: Brief summary of what it provides
- **Relevance**: Whether it could be auto-loaded for this agent type

### 1.3 Inventory Available Commands

List all custom commands in the project:

```bash
# Project commands
find .claude/commands -name "*.md" -type f 2>/dev/null | head -20

# User commands
find ~/.claude/commands -name "*.md" -type f 2>/dev/null | head -10
```

For each command found, note:
- **Name**: Command name (filename without .md)
- **Description**: From frontmatter if available
- **Relevance**: Whether the agent might invoke this command

### 1.4 Check Existing Agents

List agents already in the project:

```bash
# Project agents
ls -la .claude/agents/*.md 2>/dev/null

# User agents
ls -la ~/.claude/agents/*.md 2>/dev/null
```

Note any naming conflicts or related agents.

---

## Phase 2A: New Agent Mode (--new)

### 2.1 Research Best Practices

Before designing the agent, gather current information:

1. **Search for domain best practices**:
   - Use web search for "[agent-type] best practices 2025"
   - Look for security considerations, common patterns
   
2. **Check Context7 for relevant documentation**:
   - If agent involves specific tech (e.g., Next.js, Supabase), fetch current docs
   - Note version-specific behaviors

3. **Review community examples**:
   - Search "Claude Code [agent-type] subagent" for proven patterns

### 2.2 Ask Clarifying Questions

Before generating the specification, gather additional context:

**Required clarifications:**
- What specific use cases does this agent need to handle?
- Are there particular edge cases or constraints to consider?
- Should this agent integrate with existing agents in the project?
- Any cost/speed requirements (affects model choice)?

**Project-specific questions:**
- Does this agent need access to external services (APIs, databases)?
- Should it follow specific output formats or conventions?
- Are there security boundaries to enforce?

### 2.3 Determine Model Recommendation

Select the appropriate model based on task complexity:

| Model | Use When | Characteristics |
|-------|----------|-----------------|
| **Haiku 4.5** | Fast, repetitive tasks; simple transformations; high-volume operations | Fastest, lowest cost, good for straightforward tasks |
| **Sonnet 4.5** | Most agents; balanced reasoning; code generation; analysis | Best balance of capability and speed, default choice |
| **Opus 4.5** | Complex reasoning; nuanced decisions; security-critical; high-risk operations | Most capable, use for mission-critical work |

**Decision factors:**
- Security/audit agents → Opus 4.5 (nuanced analysis critical)
- Database migrations → Opus 4.5 (irreversible operations)
- Code review → Sonnet 4.5 (good balance)
- Test generation → Sonnet 4.5 (pattern-based)
- Linting/formatting → Haiku 4.5 (fast, simple rules)
- Documentation → Sonnet 4.5 (context-aware writing)

### 2.4 Determine Tool Permissions

Select tools based on agent responsibilities:

**Read-only agents** (reviewers, auditors, analysts):
```
tools: Read, Grep, Glob
```

**Research agents** (analysts, documenters):
```
tools: Read, Grep, Glob, WebFetch, WebSearch
```

**Code writers** (developers, implementers):
```
tools: Read, Write, Edit, Bash, Glob, Grep
```

**Full access** (orchestrators, debuggers):
```
tools: (omit to inherit all)
```

**Principle**: Grant minimum necessary permissions. Explicit is safer than implicit.

### 2.5 Identify Skills to Auto-load

Based on agent type and project context, recommend skills:

```yaml
# Example skill recommendations
skills: project-context, code-quality  # For code reviewers
skills: testing, debugging            # For test runners
skills: documentation, project-context # For doc writers
```

**Match skills to agent purpose:**
- Code agents → code-quality, project-context
- Test agents → testing, debugging
- Security agents → security, code-quality
- Doc agents → documentation, project-context

### 2.6 Generate Agent Specification

Present the complete specification in this format:

```markdown
## Agent Specification: [agent-name]

### Summary
- **Purpose**: [One-line description of what this agent does]
- **Invocation**: Use when [specific trigger conditions]
- **Model**: [Haiku 4.5 | Sonnet 4.5 | Opus 4.5] - [brief reasoning]

### Frontmatter Configuration
```yaml
---
name: [agent-name]
description: [Detailed description for automatic invocation matching - be specific about WHEN to use]
tools: [Tool1, Tool2, ...] OR omit for full access
model: [haiku | sonnet | opus]
permissionMode: [default | acceptEdits | bypassPermissions | plan]
skills: [skill1, skill2] # Optional - skills to auto-load
---
```

### System Prompt (Description Field Content)

[Full multi-paragraph system prompt that will guide the agent's behavior]

### Tool Justification
| Tool | Reason |
|------|--------|
| [Tool] | [Why this agent needs it] |

### Skills to Auto-load
| Skill | Purpose |
|-------|---------|
| [Skill] | [What knowledge it provides] |

### Available Project Commands
The agent should be aware of these commands:
- `/command-name` - [What it does]

### Usage Examples
```
> Use the [agent-name] agent to [specific task]
> Have [agent-name] analyze [specific target]
```

### Integration Notes
- [How this agent works with other agents]
- [Handoff patterns]
- [Output expectations]
```

---

## Phase 2B: Adapt Agent Mode (--adapt)

### 2.1 Locate Existing Agent

Find the agent file:

```bash
# Check project agents first
cat .claude/agents/[agent-name].md 2>/dev/null

# Fall back to user agents
cat ~/.claude/agents/[agent-name].md 2>/dev/null
```

If not found → STOP with error "Agent '[agent-name]' not found in .claude/agents/ or ~/.claude/agents/"

### 2.2 Parse Current Configuration

Extract from existing agent file:
- **Name**: From frontmatter
- **Description**: Current description text
- **Tools**: Currently granted tools
- **Model**: Currently specified model
- **Skills**: Currently auto-loaded skills
- **System prompt**: Full body content

### 2.3 Adaptation Mode Actions

#### Review Mode (default)
Analyze the agent against best practices:

**Checklist:**
- [ ] Description is specific and action-oriented
- [ ] Description includes "PROACTIVELY" or "MUST BE USED" triggers if auto-invocation desired
- [ ] Tools are minimal (principle of least privilege)
- [ ] Model matches task complexity
- [ ] Skills align with agent purpose
- [ ] System prompt has clear:
  - Role definition
  - Step-by-step workflow
  - Output format expectations
  - Error handling guidance
  - Constraints and boundaries

**Project alignment:**
- [ ] Follows project naming conventions
- [ ] References correct project paths
- [ ] Uses project-specific terminology
- [ ] Integrates with related project agents
- [ ] Leverages available project skills

**Output**: Report with findings and recommendations

#### Update Mode
Apply specific updates to the agent:

1. **Version updates**: Check for outdated tech references
2. **Tool optimization**: Add/remove tools based on actual usage patterns
3. **Skill alignment**: Update auto-loaded skills to match current project skills
4. **Description refinement**: Improve invocation matching

**Output**: Updated specification with diff summary

#### Refine Mode
Deep adaptation to project context:

1. **Inject project specifics**:
   - Replace generic paths with project paths
   - Use actual component names from project
   - Reference real folder structure
   
2. **Cross-reference integration**:
   - Link to related agents
   - Reference complementary commands
   - Document handoff patterns

3. **Optimize for project workflow**:
   - Align with CI/CD pipeline
   - Match testing conventions
   - Follow commit message formats

**Output**: Fully project-adapted specification

### 2.4 Present Adaptation Report

```markdown
## Agent Adaptation Report: [agent-name]

### Current State
- **Location**: [path to agent file]
- **Model**: [current model]
- **Tools**: [current tools]
- **Skills**: [current skills]

### Findings ([review|update|refine] mode)

#### Strengths
- [What's working well]

#### Issues Found
- [ ] [Issue 1 with severity: critical/warning/suggestion]
- [ ] [Issue 2...]

#### Recommendations

**Immediate (Critical):**
- [Must-fix items]

**Suggested (Improvements):**
- [Nice-to-have changes]

### Updated Specification

[If update or refine mode, provide the full updated agent specification]

### Available Project Resources

**Skills that could be auto-loaded:**
| Skill | Path | Relevance |
|-------|------|-----------|
| [skill] | [path] | [why useful] |

**Commands the agent should know:**
| Command | Description |
|---------|-------------|
| [/cmd] | [what it does] |

**Related agents:**
| Agent | Interaction Pattern |
|-------|---------------------|
| [agent] | [how they work together] |
```

---

## Phase 3: Validation

### 3.1 Specification Validation

**Frontmatter checks:**
- [ ] `name` is lowercase, hyphens only, max 64 chars
- [ ] `description` is non-empty, max 1024 chars
- [ ] `description` is action-oriented (starts with verb or "Use when...")
- [ ] `tools` list contains only valid tool names
- [ ] `model` is valid alias (haiku, sonnet, opus, inherit)
- [ ] `skills` reference existing skills

**System prompt checks:**
- [ ] Clearly defines agent's role
- [ ] Includes step-by-step workflow
- [ ] Specifies output format
- [ ] Handles edge cases
- [ ] Under 500 lines (recommend splitting to skills if larger)

### 3.2 Project Compatibility

- [ ] No naming conflicts with existing agents
- [ ] Tools requested are available in project
- [ ] Skills referenced exist in project
- [ ] Commands referenced exist in project
- [ ] Integrates cleanly with agent ecosystem

---

## Output Format

### For --new mode:

```markdown
## 🆕 New Agent Specification: [agent-name]

### Quick Start
To create this agent, run `/agents` and select "Create New Agent", then paste the configuration below.

[Full specification as defined in 2.6]

### Next Steps
1. Create the agent using `/agents`
2. Test with: `Use the [agent-name] agent to [example task]`
3. Iterate on the system prompt based on results
```

### For --adapt mode:

```markdown
## 🔄 Agent Adaptation: [agent-name]

### Mode: [review|update|refine]

[Adaptation report as defined in 2.4]

### Next Steps
1. Review the recommendations
2. Apply changes using `/agents` or direct file edit
3. Test the updated agent
```

---

## Error Handling

| Error | Resolution |
|-------|------------|
| No mode specified | Show usage: `--new <type> <goal>` or `--adapt <name> [mode]` |
| Agent not found (--adapt) | List available agents, suggest similar names |
| Invalid agent type (--new) | Suggest common types: code-reviewer, debugger, tester, documenter, security-auditor |
| No project context found | Warn and proceed with generic recommendations |
| Skill not found | List available skills, suggest alternatives |
| Tool name invalid | List valid tool names |

---

## Quick Reference

### --new Mode
| Agent Type | Suggested Model | Core Tools | Common Skills |
|------------|-----------------|------------|---------------|
| code-reviewer | sonnet | Read, Grep, Glob, Bash | code-quality, project-context |
| debugger | sonnet/opus | Read, Edit, Bash, Grep, Glob | debugging, testing |
| security-auditor | opus | Read, Grep, Glob | security, code-quality |
| test-runner | sonnet | Read, Write, Edit, Bash, Glob | testing, project-context |
| documenter | sonnet | Read, Write, Edit, Glob, Grep, WebFetch | documentation, project-context |
| implementer | sonnet | Read, Write, Edit, Bash, Glob, Grep | code-quality, project-context |
| architect | opus | Read, Grep, Glob, WebSearch | project-context, documentation |

### --adapt Modes
| Mode | Purpose | Output |
|------|---------|--------|
| review | Audit against best practices | Report with recommendations |
| update | Apply targeted improvements | Updated spec with diff |
| refine | Deep project adaptation | Fully customized spec |

### Valid Tools
```
Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, 
Task, Agent, Notebook, TodoRead, TodoWrite, MCP tools...
```

### Model Selection
```
haiku  → Fast, simple, high-volume
sonnet → Balanced, most agents (default)
opus   → Complex, critical, nuanced
inherit → Match main conversation
```