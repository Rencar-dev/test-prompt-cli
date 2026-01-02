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
│   └── agents/*.md        │         │ .claude/agents/*.md      │
│                          │         │ project-manifest.yaml    │
│ CLI reads manifest and   │         │ project-test-lessons.md  │
│ assembles rules into     │         │                          │
│ SKILL files              │         │                          │
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
- `gen` - Generates test implementation prompt (--type ui|unit), syncs SKILL/Agent files
- `sync` - Syncs tests after code changes (--full for ATDD/Plan/Test update)
- `learn` - Runs tests and generates feedback analysis prompt for failures

### Core Logic (src/core/)
- `prompt.ts` - Prompt generation functions (generateAtddPrompt, generatePlanPrompt, generateGenPrompt, generateSyncPrompt, generateLearnPrompt)
- `locator.ts` - File discovery logic for ATDD/Plan/Test files based on `project-manifest.yaml` configuration
- `runner.ts` - Test execution wrapper using child_process
- `setup.ts` - **SKILL/Agent file generation** (syncAllSkills, createTestMockSkill, createTestImplementerAgent, etc.)
- `rules-loader.ts` - **Manifest-based rule assembly** (loadRules, loadCommonRules, loadTestTypeRules, loadRuleContent)
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
- `skills/*.md` - SKILL templates (generated to target project's `.claude/skills/`)
- `rules/*.md` - Rule modules (selectively assembled based on manifest config)
- `agents/*.md` - Agent templates (for Sub-agent pattern, generated to `.claude/agents/`)

### SKILL Assembly Flow

```
When `gen` command runs:
1. manifest.ts: Read config from target project's project-manifest.yaml
2. rules-loader.ts: Determine rule file paths based on config
3. setup.ts: Assemble template + rules into SKILL files

Example) testRunner: vitest, stateManagement: zustand
   → skills/test-mock.md + rules/runner/vitest.md + rules/state/zustand.md
   → Target project's .claude/skills/test-mock/SKILL.md
```

### Supported Manifest Options (rules-loader.ts)

| Field | Options |
|-------|---------|
| testRunner | vitest, jest |
| stateManagement | zustand, redux, redux-toolkit, recoil, jotai, none |
| queryLibrary | tanstack-query, swr, rtk-query, apollo, none |
| mockStrategy | msw, nock, fetch-mock, module-mock |
| router | next-app, next-pages, react-router, none |

### Generated Files (in target project)

| Command | Generated Files |
|---------|-----------------|
| init | `project-test-lessons.md`, `.claude/skills/test-verify/SKILL.md`, `.claude/agents/test-implementer.md` |
| gen | `.claude/skills/test-implement/SKILL.md`, `.claude/skills/test-mock/SKILL.md`, `.claude/skills/self-learn/SKILL.md`, `.claude/skills/test-coverage/SKILL.md` |

## Key Patterns

- ESM modules with `.js` extension in imports (TypeScript compiles to ESM)
- Commands use commander.js and copy results to clipboard via clipboardy
- File paths with special characters (parentheses, spaces) require quote handling
- Test file discovery checks both co-location and configured `testPaths.dirName` directory
- SKILL files are assembled with only the necessary rules based on manifest config
