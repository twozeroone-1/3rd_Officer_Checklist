import type { ExecutionItem, TaskTemplate } from '../../domain/types';
import { bootstrapDatabase } from '../../lib/db/bootstrap';
import type { ThirdOfficerDatabase } from '../../lib/db/client';
import { loadTaskViews, type TaskView } from '../tasks/taskData';

function getDateKey(value: string) {
  return value.slice(0, 10);
}

function isOpenStatus(status: string) {
  return status !== 'done' && status !== 'skipped';
}

function getTaskFrequency(template: TaskTemplate | undefined): TaskView['frequency'] {
  if (!template) {
    return 'scenario';
  }

  return template.category === 'scenario' ? 'scenario' : template.frequency;
}

function toTaskView(item: ExecutionItem, templateById: Map<string, TaskTemplate>) {
  const template = templateById.get(item.templateId);

  return {
    item,
    template,
    frequency: getTaskFrequency(template),
  } satisfies TaskView;
}

export async function loadCalendarWorkload(database: ThirdOfficerDatabase, selectedDate: string, now: string) {
  await bootstrapDatabase(database);

  const [views, items, templates] = await Promise.all([
    loadTaskViews(database, selectedDate, now),
    database.executionItems.toArray(),
    database.taskTemplates.toArray(),
  ]);
  const selectedDateKey = getDateKey(selectedDate);
  const templateById = new Map(templates.map((template) => [template.id, template]));

  return {
    routineViews: views.filter((view) => !view.item.id.startsWith('scenario:') && !view.item.id.startsWith('conditional:') && view.frequency !== 'scenario'),
    scenarioViews: views.filter((view) => view.item.id.startsWith('scenario:') || view.item.id.startsWith('conditional:') || view.frequency === 'scenario'),
    carryOverViews: items
      .filter((item) => getDateKey(item.scheduledFor) < selectedDateKey && isOpenStatus(item.status))
      .map((item) => toTaskView(item, templateById))
      .sort((left, right) => left.item.scheduledFor.localeCompare(right.item.scheduledFor)),
    selectedDateKey,
    executionTimestamp: now,
    existingCarryOverCount: items.filter((item) => getDateKey(item.scheduledFor) < selectedDateKey && isOpenStatus(item.status)).length,
  };
}
