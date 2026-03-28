import type { ExecutionItem } from '../../domain/types';
import type { ThirdOfficerDatabase } from '../../lib/db/client';

function getDateKey(value: string) {
  return value.slice(0, 10);
}

function isOpenExecutionItem(item: ExecutionItem) {
  return item.status !== 'done' && item.status !== 'skipped';
}

function getRoutineExecutionItemId(templateId: string, scheduledFor: string) {
  return `routine:${templateId}:${getDateKey(scheduledFor)}`;
}

function getForkedRoutineExecutionItemId(item: ExecutionItem, scheduledFor: string) {
  return `${getRoutineExecutionItemId(item.templateId, scheduledFor)}:rescheduled:${getDateKey(item.scheduledFor)}`;
}

function createLogId(executionItemId: string, recordedAt: string) {
  return `log:${executionItemId}:${recordedAt}`;
}

export async function completeExecutionItem(database: ThirdOfficerDatabase, item: ExecutionItem, recordedAt: string) {
  const updated = {
    ...item,
    status: 'done' as const,
    completedAt: recordedAt,
  };

  await database.transaction('rw', database.executionItems, database.completionLogs, async () => {
    await database.executionItems.put(updated);
    await database.completionLogs.put({
      id: createLogId(item.id, recordedAt),
      executionItemId: item.id,
      status: 'done',
      recordedAt,
    });
  });
}

export async function markExecutionItemBlocked(
  database: ThirdOfficerDatabase,
  item: ExecutionItem,
  note: string,
) {
  await database.executionItems.put({
    ...item,
    status: 'blocked',
    note: note.trim() || item.note,
  });
}

export async function skipExecutionItem(database: ThirdOfficerDatabase, item: ExecutionItem, note: string) {
  await database.executionItems.put({
    ...item,
    status: 'skipped',
    note: note.trim() || item.note,
  });
}

export async function rescheduleExecutionItem(
  database: ThirdOfficerDatabase,
  item: ExecutionItem,
  scheduledFor: string,
  note: string,
) {
  const nextDateKey = getDateKey(scheduledFor);
  const currentDateKey = getDateKey(item.scheduledFor);
  const nextNote = note.trim() || item.note;
  const isRoutineItem = item.id.startsWith('routine:');

  if (!isRoutineItem || nextDateKey === currentDateKey) {
    await database.executionItems.put({
      ...item,
      scheduledFor,
      note: nextNote,
    });
    return;
  }

  const nextId = getRoutineExecutionItemId(item.templateId, scheduledFor);
  const existingTarget = await database.executionItems.get(nextId);
  const nextItem: ExecutionItem = {
    ...item,
    id: nextId,
    scheduledFor,
    note: nextNote,
  };

  await database.transaction('rw', database.executionItems, async () => {
    if (existingTarget && existingTarget.id !== item.id && isOpenExecutionItem(existingTarget)) {
      await database.executionItems.put({
        ...existingTarget,
        ...nextItem,
      });
      await database.executionItems.delete(item.id);
      return;
    }

    if (existingTarget && existingTarget.id !== item.id) {
      const forkedItem = {
        ...nextItem,
        id: getForkedRoutineExecutionItemId(item, scheduledFor),
      };

      await database.executionItems.put(forkedItem);
      await database.executionItems.delete(item.id);
      return;
    }

    await database.executionItems.put(nextItem);

    if (nextId !== item.id) {
      await database.executionItems.delete(item.id);
    }
  });
}
