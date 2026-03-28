import type { ExecutionItem, ScenarioSession, ScenarioTaskTemplate } from '../../domain/types';

import { getDateKey } from './applyConditions';

export function getActiveScenarioSessionsForDate(sessions: ScenarioSession[], dateKey: string) {
  return sessions.filter((session) => {
    if (session.status !== 'active') {
      return false;
    }

    const startedKey = getDateKey(session.startedAt);
    const endedKey = session.endedAt ? getDateKey(session.endedAt) : undefined;

    if (startedKey > dateKey) {
      return false;
    }

    if (endedKey && endedKey < dateKey) {
      return false;
    }

    return true;
  });
}

export function createScenarioExecutionItems(params: {
  templates: ScenarioTaskTemplate[];
  sessions: ScenarioSession[];
}) {
  const results: ExecutionItem[] = [];

  for (const session of params.sessions) {
    for (const template of params.templates) {
      if (template.status !== 'active' || template.scenarioType !== session.scenario) {
        continue;
      }

      results.push({
        id: `scenario:${session.id}:${template.id}`,
        templateId: template.id,
        title: template.title,
        status: 'pending',
        scheduledFor: session.startedAt,
        contexts: template.contexts,
        conditionTriggers: template.conditionTriggers,
        responsibility: template.responsibility,
        traceability: template.traceability,
      });
    }
  }

  return results;
}
