import type { ExecutionItem, RoutineTaskTemplate, ScenarioSession } from '../../domain/types';

export function getDateKey(value: string) {
  return value.slice(0, 10);
}

export function getStartOfDayIso(dateKey: string) {
  return `${dateKey}T00:00:00.000Z`;
}

export function isSameDate(value: string, dateKey: string) {
  return getDateKey(value) === dateKey;
}

export function isOpenExecutionItem(item: ExecutionItem) {
  return item.status !== 'done' && item.status !== 'skipped';
}

export function isRoutineTemplateDue(template: RoutineTaskTemplate, dateKey: string) {
  const day = new Date(getStartOfDayIso(dateKey));
  const weekday = day.getUTCDay();
  const monthDay = day.getUTCDate();

  if (template.status !== 'active') {
    return false;
  }

  if (template.frequency === 'watch' || template.frequency === 'daily') {
    return true;
  }

  if (template.frequency === 'weekly') {
    return weekday === 1;
  }

  if (template.frequency === 'monthly') {
    return monthDay === 1;
  }

  return false;
}

export function createRoutineExecutionItem(template: RoutineTaskTemplate, dateKey: string): ExecutionItem {
  return {
    id: `routine:${template.id}:${dateKey}`,
    templateId: template.id,
    title: template.title,
    status: 'pending',
    scheduledFor: getStartOfDayIso(dateKey),
    contexts: template.contexts,
    conditionTriggers: template.conditionTriggers,
    responsibility: template.responsibility,
    traceability: template.traceability,
  };
}

function getRangeStart(session: ScenarioSession, dateKey: string) {
  const sessionStart = new Date(session.startedAt);
  const dateStart = new Date(getStartOfDayIso(dateKey));
  const start = sessionStart > dateStart ? sessionStart : dateStart;
  start.setUTCMinutes(0, 0, 0);
  if (start < sessionStart) {
    start.setUTCHours(start.getUTCHours() + 1);
  }
  return start;
}

export function createHourlyAnchorItems(params: {
  template: RoutineTaskTemplate;
  session: ScenarioSession;
  dateKey: string;
  now: string;
}) {
  const { template, session, dateKey, now } = params;
  const results: ExecutionItem[] = [];
  const cursor = getRangeStart(session, dateKey);
  const nowDate = new Date(now);
  const sessionEnd = session.endedAt ? new Date(session.endedAt) : nowDate;
  const rangeEnd = sessionEnd < nowDate ? sessionEnd : nowDate;

  while (cursor <= rangeEnd && getDateKey(cursor.toISOString()) === dateKey) {
    const hourKey = cursor.toISOString().slice(0, 13);
    results.push({
      id: `conditional:${session.id}:${template.id}:${hourKey}`,
      templateId: template.id,
      title: template.title,
      status: 'pending',
      scheduledFor: cursor.toISOString(),
      contexts: template.contexts,
      conditionTriggers: template.conditionTriggers,
      responsibility: template.responsibility,
      traceability: template.traceability,
    });
    cursor.setUTCHours(cursor.getUTCHours() + 1);
  }

  return results;
}
