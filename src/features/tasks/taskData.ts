import type {
  CompletionLog,
  ExecutionItem,
  LinkedNote,
  ManualExcerpt,
  TaskTemplate,
} from '../../domain/types';
import { bootstrapDatabase } from '../../lib/db/bootstrap';
import type { ThirdOfficerDatabase } from '../../lib/db/client';
import { searchManuals } from '../../lib/search/searchManuals';
import { generateExecutionItems } from '../../lib/scheduler/generateExecutionItems';

export type TaskView = {
  item: ExecutionItem;
  template: TaskTemplate | undefined;
  frequency: 'watch' | 'daily' | 'weekly' | 'monthly' | 'conditional' | 'scenario';
};

export type TaskDetailData = {
  summary: string;
  practicalPoints: string[];
  excerpt: ManualExcerpt | null;
  sourceLabel: string;
  notes: LinkedNote[];
};

function getDateKey(value: string) {
  return value.slice(0, 10);
}

function compareRecent(left: CompletionLog, right: CompletionLog) {
  return right.recordedAt.localeCompare(left.recordedAt);
}

function derivePracticalPoints(summary: string, excerpt: ManualExcerpt | null) {
  const raw = [summary, excerpt?.summary ?? '', excerpt?.body ?? '']
    .join('. ')
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);

  return Array.from(new Set(raw)).slice(0, 3);
}

function getTaskFrequency(template: TaskTemplate | undefined): TaskView['frequency'] {
  if (!template) {
    return 'scenario';
  }

  return template.category === 'scenario' ? 'scenario' : template.frequency;
}

async function ensureSeeded(database: ThirdOfficerDatabase) {
  const [manualCount, templateCount] = await Promise.all([database.manuals.count(), database.taskTemplates.count()]);

  if (manualCount === 0 || templateCount === 0) {
    await bootstrapDatabase(database);
  }
}

export async function syncExecutionItemsForDate(database: ThirdOfficerDatabase, selectedDate: string, now: string) {
  await ensureSeeded(database);

  const [templates, existingItems, scenarioSessions] = await Promise.all([
    database.taskTemplates.toArray(),
    database.executionItems.toArray(),
    database.scenarioSessions.toArray(),
  ]);
  const generated = generateExecutionItems({
    selectedDate,
    templates,
    existingItems,
    scenarioSessions,
    now,
  });

  await database.transaction('rw', database.executionItems, async () => {
    if (generated.length > 0) {
      await database.executionItems.bulkPut(generated);
    }
  });

  return generated;
}

export async function loadTaskViews(database: ThirdOfficerDatabase, selectedDate: string, now: string) {
  await syncExecutionItemsForDate(database, selectedDate, now);

  const [items, templates] = await Promise.all([database.executionItems.toArray(), database.taskTemplates.toArray()]);
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const selectedDateKey = getDateKey(selectedDate);

  return items
    .filter((item) => getDateKey(item.scheduledFor) === selectedDateKey)
    .map((item) => ({
      item,
      template: templateById.get(item.templateId),
      frequency: getTaskFrequency(templateById.get(item.templateId)),
    }))
    .sort((left, right) => left.item.scheduledFor.localeCompare(right.item.scheduledFor));
}

export async function loadHomeData(database: ThirdOfficerDatabase, selectedDate: string, now: string) {
  await syncExecutionItemsForDate(database, selectedDate, now);

  const [items, templates, logs] = await Promise.all([
    database.executionItems.toArray(),
    database.taskTemplates.toArray(),
    database.completionLogs.toArray(),
  ]);
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const selectedDateKey = getDateKey(selectedDate);
  const todayViews = items
    .filter((item) => getDateKey(item.scheduledFor) === selectedDateKey)
    .map((item) => ({ item, template: templateById.get(item.templateId), frequency: getTaskFrequency(templateById.get(item.templateId)) }));

  return {
    todayTasks: todayViews.filter(
      (view) => !['weekly', 'monthly'].includes(view.frequency) && !['done', 'skipped'].includes(view.item.status),
    ),
    dueTasks: todayViews.filter(
      (view) => ['weekly', 'monthly'].includes(view.frequency) && !['done', 'skipped'].includes(view.item.status),
    ),
    carriedIssues: items
      .filter((item) => item.status === 'blocked' && getDateKey(item.scheduledFor) < selectedDateKey)
      .map((item) => ({ item, template: templateById.get(item.templateId), frequency: getTaskFrequency(templateById.get(item.templateId)) })),
    recentCompletions: logs
      .sort(compareRecent)
      .slice(0, 5)
      .map((log) => ({ log, item: itemById.get(log.executionItemId) })),
  };
}

export async function loadTaskDetail(database: ThirdOfficerDatabase, view: TaskView): Promise<TaskDetailData> {
  const [manuals, allNotes] = await Promise.all([database.manuals.toArray(), database.linkedNotes.toArray()]);
  const match = searchManuals(
    manuals,
    view.item.traceability[0]?.excerptId ?? view.item.traceability[0]?.documentId ?? view.item.title,
  ).find((result) => result.excerptId === view.item.traceability[0]?.excerptId);
  const notes = allNotes.filter((note) => {
    if (note.linkedType === 'execution-item' && note.linkedId === view.item.id) {
      return true;
    }

    return note.linkedType === 'task-template' && note.linkedId === view.item.templateId;
  });

  return {
    summary: view.template?.summary ?? view.item.title,
    practicalPoints: derivePracticalPoints(view.template?.summary ?? view.item.title, match?.excerpt ?? null),
    excerpt: match?.excerpt ?? null,
    sourceLabel: match ? `${match.document.code} §${match.sectionRef}` : 'No source excerpt linked',
    notes,
  };
}

export async function loadNoteTargets(database: ThirdOfficerDatabase, now: string) {
  await ensureSeeded(database);
  await syncExecutionItemsForDate(database, now, now);
  return database.executionItems.toArray();
}

export async function loadManualSearch(database: ThirdOfficerDatabase, query: string) {
  await ensureSeeded(database);
  const manuals = await database.manuals.toArray();
  return searchManuals(manuals, query);
}
