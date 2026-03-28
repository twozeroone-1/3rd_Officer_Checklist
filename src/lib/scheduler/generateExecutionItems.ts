import type { ExecutionItem, ScenarioSession, TaskTemplate } from '../../domain/types';

import {
  createHourlyAnchorItems,
  createRoutineExecutionItem,
  getDateKey,
  isOpenExecutionItem,
  isRoutineTemplateDue,
} from './applyConditions';
import { createScenarioExecutionItems, getActiveScenarioSessionsForDate } from './scenarioTriggers';

type GenerateExecutionItemsInput = {
  selectedDate: string;
  templates: TaskTemplate[];
  existingItems?: ExecutionItem[];
  scenarioSessions?: ScenarioSession[];
  now?: string;
};

export function generateExecutionItems(input: GenerateExecutionItemsInput) {
  const dateKey = getDateKey(input.selectedDate);
  const now = input.now ?? input.selectedDate;
  const existingItems = input.existingItems ?? [];
  const scenarioSessions = input.scenarioSessions ?? [];
  const existingById = new Map(existingItems.map((item) => [item.id, item]));
  const openRoutineByTemplateAndDate = new Map(
    existingItems
      .filter((item) => isOpenExecutionItem(item))
      .map((item) => [`${item.templateId}:${getDateKey(item.scheduledFor)}`, item] as const),
  );
  const activeSessions = getActiveScenarioSessionsForDate(scenarioSessions, dateKey);
  const generated: ExecutionItem[] = [];

  for (const template of input.templates) {
    if (template.category === 'routine') {
      if (template.frequency === 'conditional') {
        if (template.conditionTriggers.includes('hourly-anchor')) {
          for (const session of activeSessions.filter((candidate) => candidate.scenario === 'anchoring')) {
            generated.push(...createHourlyAnchorItems({ template, session, dateKey, now }));
          }
        }
        continue;
      }

      if (isRoutineTemplateDue(template, dateKey)) {
        generated.push(
          openRoutineByTemplateAndDate.get(`${template.id}:${dateKey}`) ?? createRoutineExecutionItem(template, dateKey),
        );
      }
      continue;
    }
  }

  generated.push(
    ...createScenarioExecutionItems({
      templates: input.templates.filter((template) => template.category === 'scenario'),
      sessions: activeSessions,
    }),
  );

  const merged = generated.map((item) => existingById.get(item.id) ?? item);
  const overdueOpenItems = existingItems.filter(
    (item) => getDateKey(item.scheduledFor) < dateKey && isOpenExecutionItem(item),
  );

  return Array.from(new Map([...merged, ...overdueOpenItems].map((item) => [item.id, item])).values()).sort((left, right) =>
    left.scheduledFor.localeCompare(right.scheduledFor),
  );
}
