#!/usr/bin/env python3
"""
Task Management Project Initialization Script

Creates project-specific task management structure with customizable configuration.
"""

import argparse
import os
import sys
from pathlib import Path
from datetime import datetime
import yaml

DEFAULT_CONFIG = {
    'project_name': 'MyProject',
    'complexity_unit': 'units',  # or 'story-points', 'hours', 'Q-Units'
    'complexity_scale': 'small (1-2), medium (3-5), large (6-10)',
    'statuses': ['TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE'],
    'priority_levels': ['P0-Critical', 'P1-High', 'P2-Medium', 'P3-Low'],
    'modules': [],  # Will be populated by user
    'approval_gates_enabled': False,
    'integration_external_tracker': None,  # 'jira', 'github', 'linear', etc.
}

TASK_INDEX_TEMPLATE = """# Task Index - {project_name}

**Last Updated:** {date}
**Project:** {project_name}
**Complexity Unit:** {complexity_unit}

## Overview

This file tracks all tasks for the {project_name} project. Tasks are organized into backlog, active, and completed categories.

## Active Tasks

| ID | Title | Status | Priority | Complexity | Module | Assignee |
|----|-------|--------|----------|------------|--------|----------|
| - | No active tasks | - | - | - | - | - |

**Total Active:** 0 tasks, 0 {complexity_unit}

## Backlog

| ID | Title | Priority | Complexity | Module | Notes |
|----|-------|----------|------------|--------|-------|
| - | No backlog tasks | - | - | - | - |

**Total Backlog:** 0 tasks, 0 {complexity_unit}

## Completed

| ID | Title | Completed | Complexity | Module |
|----|-------|-----------|------------|--------|
| - | No completed tasks | - | - | - |

**Total Completed:** 0 tasks, 0 {complexity_unit}

---

## Statistics

- **Total tasks:** 0
- **Completion rate:** 0%
- **Average complexity:** N/A

## Recent Activity

- {date}: Project initialized
"""

EXAMPLE_TASK_TEMPLATE = """## Task: [Setup Project Task Management]

**ID:** TASK-000
**Priority:** P1-High
**Complexity:** 1 {complexity_unit}
**Module:** project-setup
**Status:** DONE
**Created:** {date}

### Context
Initialize task management system for {project_name} project.

### Acceptance Criteria
- [x] Task directory structure created
- [x] Configuration file created (.task-config.yaml)
- [x] Task index initialized (INDEX.md)
- [x] Example task created
- [x] Templates customized for project

### Dependencies
None (foundation task)

### Test Coverage
- Manual verification of directory structure
- Configuration file validation

### Definition of Done
- [x] Directory structure exists
- [x] All template files generated
- [x] Team can create new tasks using templates
- [x] Configuration matches project needs

### Notes
This is the foundation task for the project's task management system.
Created by init_project_tasks.py script.
"""

def create_directory_structure(base_path: Path, project_name: str):
    """Create the task management directory structure."""
    dirs = [
        'tasks',
        'tasks/backlog',
        'tasks/active',
        'tasks/completed',
    ]
    
    for dir_path in dirs:
        full_path = base_path / dir_path
        full_path.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created directory: {dir_path}")

def create_config_file(base_path: Path, config: dict):
    """Create the .task-config.yaml file."""
    config_path = base_path / '.task-config.yaml'
    
    with open(config_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)
    
    print(f"✓ Created configuration: .task-config.yaml")

def create_index_file(base_path: Path, config: dict):
    """Create the task index file."""
    index_path = base_path / 'tasks' / 'INDEX.md'
    
    content = TASK_INDEX_TEMPLATE.format(
        project_name=config['project_name'],
        date=datetime.now().strftime('%Y-%m-%d'),
        complexity_unit=config['complexity_unit']
    )
    
    with open(index_path, 'w') as f:
        f.write(content)
    
    print(f"✓ Created task index: tasks/INDEX.md")

def create_example_task(base_path: Path, config: dict):
    """Create an example task."""
    task_path = base_path / 'tasks' / 'completed' / 'TASK-000-project-setup.md'
    
    content = EXAMPLE_TASK_TEMPLATE.format(
        complexity_unit=config['complexity_unit'],
        date=datetime.now().strftime('%Y-%m-%d'),
        project_name=config['project_name']
    )
    
    with open(task_path, 'w') as f:
        f.write(content)
    
    print(f"✓ Created example task: tasks/completed/TASK-000-project-setup.md")

def create_readme(base_path: Path, config: dict):
    """Create a README for the tasks directory."""
    readme_path = base_path / 'tasks' / 'README.md'
    
    content = f"""# Task Management - {config['project_name']}

This directory contains all task specifications for the {config['project_name']} project.

## Directory Structure

```
tasks/
├── INDEX.md           # Task summary and roadmap
├── backlog/           # Future work, not yet started
├── active/            # Currently in progress
├── completed/         # Finished tasks (archive)
└── README.md          # This file
```

## Task Naming Convention

Tasks are named: `TASK-XXX-brief-description.md`

Where:
- `XXX` is a sequential number (001, 002, 003, ...)
- `brief-description` is a short slug describing the task

## Creating New Tasks

1. Use templates from the task-management skill
2. Copy appropriate template (feature, bug, refactoring, etc.)
3. Fill in all required fields
4. Save to `tasks/backlog/` or `tasks/active/`
5. Update `INDEX.md` with new task entry

## Task Status Flow

```
TODO → IN_PROGRESS → REVIEW → DONE
          ↓
       BLOCKED (if issues arise)
```

## Configuration

Task management configured in `../.task-config.yaml`:
- Complexity unit: {config['complexity_unit']}
- Priority levels: {', '.join(config['priority_levels'])}
- Statuses: {', '.join(config['statuses'])}

## See Also

- Task templates: [task-management-skill/references/task-templates.md]
- Acceptance criteria guide: [task-management-skill/references/acceptance-criteria.md]
- Decomposition patterns: [task-management-skill/references/decomposition-patterns.md]
"""
    
    with open(readme_path, 'w') as f:
        f.write(content)
    
    print(f"✓ Created tasks README: tasks/README.md")

def get_user_config(args):
    """Get configuration from user arguments or prompts."""
    config = DEFAULT_CONFIG.copy()
    
    # Set project name
    if args.project_name:
        config['project_name'] = args.project_name
    
    # Set complexity unit
    if args.complexity_unit:
        config['complexity_unit'] = args.complexity_unit
    
    # Set modules if provided
    if args.modules:
        config['modules'] = [
            {'name': module, 'path': f'src/{module}', 'owner': None}
            for module in args.modules
        ]
    
    return config

def main():
    parser = argparse.ArgumentParser(
        description='Initialize task management structure for a project',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic initialization
  python init_project_tasks.py --project-name "MyApp" --path ./
  
  # With custom complexity unit
  python init_project_tasks.py --project-name "MyApp" --complexity-unit "story-points" --path ./
  
  # With modules
  python init_project_tasks.py --project-name "MyApp" --modules auth payment dashboard --path ./
        """
    )
    
    parser.add_argument(
        '--project-name',
        type=str,
        required=True,
        help='Name of the project'
    )
    
    parser.add_argument(
        '--path',
        type=str,
        default='.',
        help='Base path where task structure should be created (default: current directory)'
    )
    
    parser.add_argument(
        '--complexity-unit',
        type=str,
        default='units',
        choices=['units', 'story-points', 'hours', 'Q-Units', 'days'],
        help='Unit for measuring task complexity (default: units)'
    )
    
    parser.add_argument(
        '--modules',
        nargs='+',
        help='List of module names in the project (e.g., auth payment dashboard)'
    )
    
    args = parser.parse_args()
    
    # Validate path
    base_path = Path(args.path).resolve()
    if not base_path.exists():
        print(f"Error: Path '{base_path}' does not exist")
        sys.exit(1)
    
    # Get configuration
    config = get_user_config(args)
    
    # Create structure
    print(f"\n🚀 Initializing task management for '{config['project_name']}'...\n")
    
    try:
        create_directory_structure(base_path, config['project_name'])
        create_config_file(base_path, config)
        create_index_file(base_path, config)
        create_example_task(base_path, config)
        create_readme(base_path, config)
        
        print(f"\n✅ Success! Task management initialized in {base_path}")
        print(f"\n📝 Next steps:")
        print(f"   1. Review and customize .task-config.yaml")
        print(f"   2. Add your project's modules to the configuration")
        print(f"   3. Start creating tasks in tasks/backlog/")
        print(f"   4. Use task-management skill templates for consistency")
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
