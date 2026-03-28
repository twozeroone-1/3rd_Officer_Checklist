import { bootstrapDatabase } from '../../lib/db/bootstrap';
import { ThirdOfficerDatabase } from '../../lib/db/client';
import { loadHomeData, syncExecutionItemsForDate } from './taskData';

function createTestDatabase(name: string) {
  return new ThirdOfficerDatabase(name);
}

describe('syncExecutionItemsForDate', () => {
  it('preserves generated scenario and conditional items after the source session disappears', async () => {
    const database = createTestDatabase('task-data-stale-generated');
    await bootstrapDatabase(database);

    await database.scenarioSessions.put({
      id: 'session-anchor',
      scenario: 'anchoring',
      status: 'active',
      startedAt: '2026-04-01T01:15:00.000Z',
      contexts: ['anchoring'],
      executionItemIds: [],
      responsibility: 'bridge-team',
      traceability: [{ documentId: 'fleet-i21', excerptId: 'fleet-i21-anchor-prep', sectionRef: '2.2' }],
    });

    await syncExecutionItemsForDate(database, '2026-04-01T08:00:00.000Z', '2026-04-01T03:20:00.000Z');

    expect(await database.executionItems.get('scenario:session-anchor:anchoring-preparation')).toBeDefined();
    expect(await database.executionItems.get('conditional:session-anchor:anchor-position-hourly-check:2026-04-01T02')).toBeDefined();

    await database.scenarioSessions.clear();
    await syncExecutionItemsForDate(database, '2026-04-01T08:00:00.000Z', '2026-04-01T08:00:00.000Z');

    expect(await database.executionItems.get('scenario:session-anchor:anchoring-preparation')).toBeDefined();
    expect(await database.executionItems.get('conditional:session-anchor:anchor-position-hourly-check:2026-04-01T02')).toBeDefined();

    await database.delete();
  });
});

describe('loadHomeData', () => {
  it('keeps same-day blocked tasks in today buckets and only shows carried-over issues from before today', async () => {
    const database = createTestDatabase('task-data-home-buckets');
    await bootstrapDatabase(database);

    await database.executionItems.bulkPut([
      {
        id: 'routine:navigational-equipment-checks:2026-04-01',
        templateId: 'navigational-equipment-checks',
        title: 'Check navigational equipment readiness',
        status: 'blocked',
        scheduledFor: '2026-04-01T08:00:00.000Z',
        contexts: ['sea'],
        conditionTriggers: ['during-watch'],
        responsibility: 'third-officer',
        traceability: [{ documentId: 'fleet-12', excerptId: 'fleet-12-nav-equipment-check', sectionRef: '4.4' }],
      },
      {
        id: 'routine:watch-handover-prep:2026-03-31',
        templateId: 'watch-handover-prep',
        title: 'Prepare for watch handover',
        status: 'blocked',
        scheduledFor: '2026-03-31T08:00:00.000Z',
        contexts: ['sea'],
        conditionTriggers: ['before-watch'],
        responsibility: 'third-officer',
        traceability: [{ documentId: 'fleet-12', excerptId: 'fleet-12-watch-handover', sectionRef: '4.1' }],
      },
      {
        id: 'routine:lsa-ffa-monthly-check:2026-04-01',
        templateId: 'lsa-ffa-monthly-check',
        title: 'Perform monthly LSA and FFA inspection',
        status: 'skipped',
        scheduledFor: '2026-04-01T00:00:00.000Z',
        contexts: ['safety'],
        conditionTriggers: ['monthly-safety'],
        responsibility: 'third-officer',
        traceability: [{ documentId: 'fleet-i13', excerptId: 'fleet-i13-monthly-lsa-ffa', sectionRef: '5.2' }],
      },
    ]);

    const data = await loadHomeData(database, '2026-04-01T08:00:00.000Z', '2026-04-01T08:00:00.000Z');

    expect(data.todayTasks.some((entry) => entry.item.id === 'routine:navigational-equipment-checks:2026-04-01')).toBe(true);
    expect(data.carriedIssues.map((entry) => entry.item.id)).toContain('routine:watch-handover-prep:2026-03-31');
    expect(data.carriedIssues.map((entry) => entry.item.id)).not.toContain('routine:navigational-equipment-checks:2026-04-01');
    expect(data.dueTasks.map((entry) => entry.item.id)).not.toContain('routine:lsa-ffa-monthly-check:2026-04-01');

    await database.delete();
  });
});
