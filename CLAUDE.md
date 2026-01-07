# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Key Architecture

**This repo provides a CLI tool. CLI commands are executed in other projects (user's app).**

```
This Repo (test-prompt-cli)           Target Project (user's app)
┌──────────────────────────┐         ┌──────────────────────────┐
│ src/prompts/             │         │ (npx @hsna/prompt gen)   │
│   ├── skills/*.md        │  ──▶    │                          │
│   ├── rules/*.md         │         │ .claude/skills/*.md      │
│   └── agents/*.md        │         │ .claude/rules/*.md       │
│                          │         │ .claude/agents/*.md      │
│ CLI copies rules and     │         │ project-manifest.yaml    │
│ generates SKILL files    │         │ project-test-lessons.md  │
└──────────────────────────┘         └──────────────────────────┘
```

## Project Overview

`@hsna/prompt` - A CLI tool that generates optimized prompts for AI-powered frontend test automation.
Automates context gathering for test generation through an ATDD (Acceptance Test Driven Development) workflow.

## Common Commands

```bash
# Development
npm run dev              # Run with tsx (hot reload)
npm run build            # Build to dist/ (includes copying prompt .md files)
npm link                 # Link locally for testing CLI commands

# Testing
npm test                 # Run all tests with vitest
npm run test:watch       # Watch mode
vitest run src/core/prompt.test.ts  # Run specific test file

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix lint issues
npm run format           # Prettier format
```

## Architecture

### CLI Commands (src/commands/)
Each command corresponds to a step in the ATDD workflow:
- `init` - Generates project analysis prompt, creates `project-test-lessons.md`, SKILL/Agent files
- `atdd` - Generates acceptance test scenario design prompt
- `plan` - Generates test routing (unit vs UI vs E2E) plan prompt
- `gen` - Generates test implementation prompt (--type ui|unit), syncs SKILL/Agent/Rules files
- `sync` - Syncs tests after code changes (--full for ATDD/Plan/Test update)
- `learn` - Runs tests and generates feedback analysis prompt for failures

### Core Logic (src/core/)
- `prompt.ts` - Prompt generation functions (generateAtddPrompt, generatePlanPrompt, generateGenPrompt, generateSyncPrompt, generateLearnPrompt)
- `locator.ts` - File discovery logic for ATDD/Plan/Test files based on `project-manifest.yaml` configuration
- `runner.ts` - Test execution wrapper using child_process
- `setup.ts` - **SKILL/Rules file generation** (syncAllSkills, syncRuleFiles, createTestMockSkill, etc.)
- `rules-loader.ts` - Rule module definitions (RULE_MODULES, CONTEXT_BASED_RULES)
- `test-type.ts` - Test type enum (ui | unit) and template mapping

### Utils (src/utils/)
- `manifest.ts` - ManifestConfig type definition and YAML parsing
- `interactive.ts` - Interactive mode file selector (prompts library)
- `file-scanner.ts` - File scanning logic (scanForAtdd, scanForPlan, scanForGen, scanForSync, scanForLearn)
- `file.ts` - File reading utilities
- `clipboard.ts` - Clipboard copy (clipboardy)
- `logger.ts` - Logging utilities

### Prompt Templates (src/prompts/)
- `*.md` - Prompt templates (`{{PLACEHOLDER}}` syntax for variable substitution)
- `skills/*.md` - SKILL templates (lightweight, reference rules via file paths)
- `rules/*.md` - Rule modules (copied to target project, AI reads as needed)
- `agents/*.md` - Agent templates (for Sub-agent pattern, generated to `.claude/agents/`)

### SKILL Assembly Flow (Manifest-based Reference)

```
When `gen` command runs:
1. syncRuleFiles(): Copy all rules from prompts/rules/ to .claude/rules/
2. getRuleFilePaths(): Resolve rule paths based on project-manifest.yaml
3. createTestImplementSkill(): Generate SKILL with specific rule paths injected
4. createTestMockSkill(): Generate SKILL with specific rule paths injected

Example) testRunner: vitest, stateManagement: zustand
   → SKILL includes:
     - .claude/rules/_common.md
     - .claude/rules/test-type/ui.md
     - .claude/rules/runner/_shared.md
     - .claude/rules/runner/vitest.md
     - .claude/rules/state/zustand.md
```

**Rule Resolution**:
- **RULE_MODULES**: Manifest-based rules (testRunner, stateManagement, queryLibrary, mockStrategy, router)
- **CONTEXT_BASED_RULES**: Code pattern hints for AI (e.g., "Date, setTimeout → time-mocking.md")

### Rule Modules (src/prompts/rules/)

Rules are organized by category:
- `_common.md` - Base rules (always referenced)
- `test-type/{ui,unit}.md` - Test type specific (based on --type)
- `runner/{_shared,vitest,jest}.md` - Test runner rules
- `state/{zustand,redux-toolkit,recoil,jotai}.md` - State management
- `query/{tanstack-query,swr,rtk-query,apollo}.md` - Data fetching
- `mock/{msw,nock,fetch-mock,module-mock,time-mocking}.md` - Mocking
- `router/{next-app,next-pages,react-router}.md` - Router

**Adding new rules**: Add .md file to appropriate folder. All rules are auto-copied.

### Generated Files (in target project)

| Command | Generated Files |
|---------|-----------------|
| init | `project-test-lessons.md`, `.claude/skills/test-verify/SKILL.md`, `.claude/agents/test-implementer.md` |
| gen | `.claude/rules/*`, `.claude/skills/test-implement/SKILL.md`, `.claude/skills/test-mock/SKILL.md`, `.claude/skills/self-learn/SKILL.md`, `.claude/skills/test-coverage/SKILL.md` |

## Key Patterns

- ESM modules with `.js` extension in imports (TypeScript compiles to ESM)
- Commands use commander.js and copy results to clipboard via clipboardy
- File paths with special characters (parentheses, spaces) require quote handling
- Test file discovery checks both co-location and configured `testPaths.dirName` directory
- SKILL files reference rules; AI reads and applies based on scope metadata
