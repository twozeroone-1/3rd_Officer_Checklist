# Third Officer Assistant Design

## Goal

Build a personal offline mobile app for a 3rd officer that converts company manuals and handover knowledge into daily, weekly, monthly, and situation-based checklists that are fast to execute onboard.

## Product Definition

- Android-first, Chrome-installable PWA
- Personal use, offline-first
- Home screen focused on today's actionable work
- Manuals act as traceable references, not the primary navigation model

## Core UX

- Home shows today's tasks, due routine tasks, recent completions, and high-risk unresolved issues
- Routine area groups tasks by `watch`, `daily`, `weekly`, `monthly`, and `conditional`
- Scenario modes cover `arrival`, `departure`, `anchoring`, and `in-port watch`
- Task completion is one-tap by default with automatic date/time capture
- Manual references open in a bottom sheet with summary, excerpt, and linked notes

## Information Model

The app converts source manuals into three layers:

1. `Manual documents` with metadata
2. `Task templates` derived from approved procedures
3. `Execution items` generated for a selected date or scenario session

Each execution item stores:

- title
- status
- generated date context
- execution timestamp
- manual traceability
- user note / issue note

## V1 Manual Scope

- `FLEET-12 NAVIGATION AT SEA`
- `FLEET-13 IN-PORT WATCHKEEPING OPERATION`
- `FLEET-15 SHIP ARRIVAL & DEPARTURE`
- `FLEET-I13 LSA & FFA MAINTENANCE INSTRUCTION`
- `FLEET-I21 ANCHORING INSTRUCTION`

## V1 Functional Scope

Included:

- Offline installable PWA
- Routine task generation by selected date
- Guided scenario sessions for arrival/departure/anchoring/in-port watch
- Linked manual helper and handover notes
- Local backup export/import
- True-black night mode

Excluded:

- Cloud sync
- Multi-user collaboration
- Company submission workflow
- Full automatic PDF extraction
- Native Android package

## Data Principles

- Local IndexedDB is the source of truth
- Seeded manual/task content is versioned
- Backup format must be versioned and portable
- Manual references must stay attached to generated tasks

## Safety Principles

- High-risk unresolved issues remain pinned on Home
- Guidance and recordkeeping remain visually distinct
- Large touch targets and low-light readability are mandatory

## Acceptance Criteria

- Android Chrome can install the app to home screen
- After initial load, the app works offline
- A selected date generates the correct workload from templates
- Task completion takes one tap and records date/time automatically
- Each task can open its linked manual context
- Backup export/import restores logs, notes, and settings
