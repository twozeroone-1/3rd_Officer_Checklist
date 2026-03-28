# Third Officer Assistant Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Android-first offline PWA that helps a 3rd officer manage routine and scenario-based tasks derived from curated H-Line manuals.

**Architecture:** Use a React + TypeScript PWA with IndexedDB for local persistence. Curated manual excerpts and task templates are seed data; a local scheduler generates execution items by date and scenario.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, React Router, Zustand, Dexie, Zod, date-fns, vite-plugin-pwa, Vitest, React Testing Library, Playwright

---

## Chunk 1: Foundations

### Task 1: Scaffold the installable PWA shell

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `public/manifest.webmanifest`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Test: `src/app/App.test.tsx`

- [ ] Write a failing smoke test for app shell navigation.
- [ ] Scaffold the Vite React TypeScript app.
- [ ] Configure Tailwind and PWA install support.
- [ ] Run unit tests and make them pass.

### Task 2: Define schemas and persistence

**Files:**
- Create: `src/domain/schema.ts`
- Create: `src/domain/types.ts`
- Create: `src/lib/db/*`
- Test: `src/domain/schema.test.ts`

- [ ] Write failing schema tests.
- [ ] Define domain models for manuals, templates, execution items, logs, notes, sessions, and backups.
- [ ] Implement IndexedDB schema and bootstrap.
- [ ] Run tests and make them pass.

### Task 3: Add curated manual and template seed data

**Files:**
- Create: `src/data/manuals/*.json`
- Create: `src/data/templates/*.ts`
- Test: `src/data/templates/manualTemplates.test.ts`

- [ ] Write a failing test that each task template maps to at least one manual excerpt.
- [ ] Add curated excerpts for the five approved manuals.
- [ ] Add routine and scenario templates.
- [ ] Run tests and make them pass.

## Chunk 2: Core Task Loop

### Task 4: Implement local scheduling

**Files:**
- Create: `src/lib/scheduler/*`
- Test: `src/lib/scheduler/generateExecutionItems.test.ts`

- [ ] Write failing tests for date-driven task generation.
- [ ] Implement routine and relative-condition scheduling.
- [ ] Verify tests pass.

### Task 5: Build the main task flow

**Files:**
- Create: `src/features/home/*`
- Create: `src/features/tasks/*`
- Create: `src/features/routine/*`
- Test: `src/features/home/HomePage.test.tsx`
- Test: `tests/e2e/routine-flow.spec.ts`

- [ ] Write failing tests for one-tap completion.
- [ ] Build Home, Routine, Task Card, and Task Detail flows.
- [ ] Add automatic timestamp capture and issue states.
- [ ] Verify unit and e2e tests pass.

### Task 6: Add document helper and notes

**Files:**
- Create: `src/features/documents/*`
- Create: `src/features/notes/*`
- Create: `src/lib/search/*`
- Test: `src/lib/search/searchManuals.test.ts`

- [ ] Write failing search tests.
- [ ] Add manual lookup, excerpt viewer, linked notes, and free notes.
- [ ] Verify tests pass.

## Chunk 3: Guided Operations and Hardening

### Task 7: Add scenario modes

**Files:**
- Create: `src/features/scenarios/*`
- Test: `src/features/scenarios/scenarioSession.test.tsx`

- [ ] Write failing tests for scenario session generation.
- [ ] Implement arrival, departure, anchoring, and in-port watch sessions.
- [ ] Verify tests pass.

### Task 8: Add calendar, backup, settings, and offline QA

**Files:**
- Create: `src/features/calendar/*`
- Create: `src/features/settings/*`
- Create: `src/lib/backup/*`
- Test: `tests/e2e/offline.spec.ts`
- Test: `tests/e2e/backup-restore.spec.ts`

- [ ] Write failing backup and offline behavior tests.
- [ ] Add date workload view, backup export/import, and settings.
- [ ] Verify the app works offline on Android Chrome after installation.
- [ ] Run full unit and e2e suites.
