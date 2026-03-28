import { bootstrapDatabase } from '../../lib/db/bootstrap';
import { ThirdOfficerDatabase } from '../../lib/db/client';
import { generateExecutionItems } from '../../lib/scheduler/generateExecutionItems';
import type { ExecutionItem } from '../../domain/types';
import { rescheduleExecutionItem } from './taskActions';

function createTestDatabase(name: string) {
  return new ThirdOfficerDatabase(name);
}

describe('taskActions', () => {
  it('reschedules a routine item onto the target date without leaving a duplicate generated item', async () => {
    const database = createTestDatabase('task-actions-reschedule');
    await bootstrapDatabase(database);

    const original: ExecutionItem = {
      id: 'routine:watch-handover-prep:2026-04-01',
      templateId: 'watch-handover-prep',
      title: 'Prepare for watch handover',
      status: 'pending' as const,
      scheduledFor: '2026-04-01T00:00:00.000Z',
      contexts: ['sea'],
      conditionTriggers: ['before-watch'],
      responsibility: 'third-officer' as const,
      traceability: [{ documentId: 'fleet-12', excerptId: 'fleet-12-watch-handover', sectionRef: '4.1' }],
    };

    await database.executionItems.put(original);

    await rescheduleExecutionItem(
      database,
      original,
      '2026-04-02T14:45:00.000Z',
      'Shift to afternoon handover.',
    );

    const templates = await database.taskTemplates.toArray();
    const existingItems = await database.executionItems.toArray();
    const generated = generateExecutionItems({
      selectedDate: '2026-04-02T08:00:00.000Z',
      templates,
      existingItems,
      now: '2026-04-02T08:00:00.000Z',
    });

    expect(await database.executionItems.get('routine:watch-handover-prep:2026-04-01')).toBeUndefined();
    expect(await database.executionItems.get('routine:watch-handover-prep:2026-04-02')).toMatchObject({
      scheduledFor: '2026-04-02T14:45:00.000Z',
      note: 'Shift to afternoon handover.',
    });
    expect(generated.filter((item) => item.templateId === 'watch-handover-prep')).toHaveLength(1);

    await database.delete();
  });

  it('does not overwrite a closed routine item that already exists on the target date', async () => {
    const database = createTestDatabase('task-actions-closed-target');
    await bootstrapDatabase(database);

    const original: ExecutionItem = {
      id: 'routine:watch-handover-prep:2026-04-01',
      templateId: 'watch-handover-prep',
      title: 'Prepare for watch handover',
      status: 'pending' as const,
      scheduledFor: '2026-04-01T00:00:00.000Z',
      contexts: ['sea'],
      conditionTriggers: ['before-watch'],
      responsibility: 'third-officer' as const,
      traceability: [{ documentId: 'fleet-12', excerptId: 'fleet-12-watch-handover', sectionRef: '4.1' }],
    };
    const closedTarget: ExecutionItem = {
      ...original,
      id: 'routine:watch-handover-prep:2026-04-02',
      status: 'done' as const,
      scheduledFor: '2026-04-02T00:00:00.000Z',
      completedAt: '2026-04-02T00:10:00.000Z',
    };

    await database.executionItems.bulkPut([original, closedTarget]);

    await rescheduleExecutionItem(
      database,
      original,
      '2026-04-02T14:45:00.000Z',
      'Shift to afternoon handover.',
    );

    expect(await database.executionItems.get(closedTarget.id)).toMatchObject({
      status: 'done',
      completedAt: '2026-04-02T00:10:00.000Z',
      scheduledFor: '2026-04-02T00:00:00.000Z',
    });
    expect(await database.executionItems.get(original.id)).toBeUndefined();
    expect(await database.executionItems.get('routine:watch-handover-prep:2026-04-02:rescheduled:2026-04-01')).toMatchObject({
      scheduledFor: '2026-04-02T14:45:00.000Z',
      note: 'Shift to afternoon handover.',
      status: 'pending',
    });

    await database.delete();
  });
});
