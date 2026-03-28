import type { ExecutionItem, RoutineTaskTemplate, ScenarioSession } from '../../domain/types';
import { routineTemplates } from '../../data/templates/routineTemplates';
import { scenarioTemplates } from '../../data/templates/scenarioTemplates';
import { generateExecutionItems } from './generateExecutionItems';

const dailyTemplate: RoutineTaskTemplate = {
  id: 'daily-bridge-log-review',
  title: 'Review bridge log remarks',
  category: 'routine',
  summary: 'Review standing remarks and unresolved navigation notes once per day.',
  frequency: 'daily',
  contexts: ['sea'],
  conditionTriggers: ['during-watch'],
  responsibility: 'third-officer',
  status: 'active',
  traceability: [{ documentId: 'fleet-12', excerptId: 'fleet-12-watch-handover', sectionRef: '4.1' }],
};

describe('generateExecutionItems', () => {
  it('generates watch, daily, weekly, and monthly items with deterministic ids for the selected date', () => {
    const items = generateExecutionItems({
      selectedDate: '2026-04-01T08:00:00.000Z',
      templates: [...routineTemplates, dailyTemplate, ...scenarioTemplates],
      now: '2026-04-01T08:00:00.000Z',
    });

    expect(items.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'routine:watch-handover-prep:2026-04-01',
        'routine:navigational-equipment-checks:2026-04-01',
        'routine:daily-bridge-log-review:2026-04-01',
        'routine:lsa-ffa-monthly-check:2026-04-01',
      ]),
    );
    expect(items.some((item) => item.templateId === 'arrival-bridge-preparation')).toBe(false);
  });

  it('preserves existing same-day execution state and keeps older open items visible as overdue', () => {
    const existingDone: ExecutionItem = {
      id: 'routine:watch-handover-prep:2026-04-01',
      templateId: 'watch-handover-prep',
      title: 'Prepare for watch handover',
      status: 'done',
      scheduledFor: '2026-04-01T00:00:00.000Z',
      contexts: ['sea'],
      conditionTriggers: ['before-watch'],
      responsibility: 'third-officer',
      traceability: [{ documentId: 'fleet-12', excerptId: 'fleet-12-watch-handover', sectionRef: '4.1' }],
      completedAt: '2026-04-01T08:15:00.000Z',
    };
    const overdue: ExecutionItem = {
      id: 'routine:lsa-ffa-weekly-check:2026-03-29',
      templateId: 'lsa-ffa-weekly-check',
      title: 'Perform weekly LSA and FFA check',
      status: 'blocked',
      scheduledFor: '2026-03-29T00:00:00.000Z',
      contexts: ['safety'],
      conditionTriggers: ['weekly-safety'],
      responsibility: 'third-officer',
      traceability: [{ documentId: 'fleet-i13', excerptId: 'fleet-i13-weekly-lsa-ffa', sectionRef: '5.1' }],
      note: 'Need stores support.',
    };

    const items = generateExecutionItems({
      selectedDate: '2026-04-01T08:00:00.000Z',
      templates: routineTemplates,
      existingItems: [existingDone, overdue],
      now: '2026-04-01T08:00:00.000Z',
    });

    expect(items.find((item) => item.id === existingDone.id)).toMatchObject({
      status: 'done',
      completedAt: '2026-04-01T08:15:00.000Z',
    });
    expect(items.find((item) => item.id === overdue.id)).toBe(overdue);
  });

  it('creates hourly anchor checks and scenario tasks only when a matching scenario session is active', () => {
    const scenarioSessions: ScenarioSession[] = [
      {
        id: 'session-anchor',
        scenario: 'anchoring',
        status: 'active',
        startedAt: '2026-04-01T01:15:00.000Z',
        contexts: ['anchoring'],
        executionItemIds: [],
        responsibility: 'bridge-team',
        traceability: [{ documentId: 'fleet-i21', excerptId: 'fleet-i21-anchor-prep', sectionRef: '2.2' }],
      },
    ];

    const items = generateExecutionItems({
      selectedDate: '2026-04-01T08:00:00.000Z',
      templates: [...routineTemplates, ...scenarioTemplates],
      scenarioSessions,
      now: '2026-04-01T03:20:00.000Z',
    });

    expect(items.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'scenario:session-anchor:anchoring-preparation',
        'conditional:session-anchor:anchor-position-hourly-check:2026-04-01T02',
        'conditional:session-anchor:anchor-position-hourly-check:2026-04-01T03',
      ]),
    );
    expect(items.some((item) => item.templateId === 'arrival-bridge-preparation')).toBe(false);
  });

  it('reuses an open rescheduled item instead of generating a duplicate routine item for the target date', () => {
    const rescheduledItem: ExecutionItem = {
      id: 'routine:watch-handover-prep:2026-03-31',
      templateId: 'watch-handover-prep',
      title: 'Prepare for watch handover',
      status: 'blocked',
      scheduledFor: '2026-04-01T14:45:00.000Z',
      contexts: ['sea'],
      conditionTriggers: ['before-watch'],
      responsibility: 'third-officer',
      traceability: [{ documentId: 'fleet-12', excerptId: 'fleet-12-watch-handover', sectionRef: '4.1' }],
      note: 'Delayed to afternoon handover.',
    };

    const items = generateExecutionItems({
      selectedDate: '2026-04-01T08:00:00.000Z',
      templates: routineTemplates,
      existingItems: [rescheduledItem],
      now: '2026-04-01T08:00:00.000Z',
    });

    expect(items.filter((item) => item.templateId === 'watch-handover-prep')).toEqual([rescheduledItem]);
    expect(items.some((item) => item.id === 'routine:watch-handover-prep:2026-04-01')).toBe(false);
  });
});
