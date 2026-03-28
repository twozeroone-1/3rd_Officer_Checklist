import type { ExecutionItem, ScenarioSession } from '../../domain/types';
import { bootstrapDatabase } from '../../lib/db/bootstrap';
import type { ThirdOfficerDatabase } from '../../lib/db/client';
import { loadTaskViews } from '../tasks/taskData';
import { getScenarioDefinition } from './scenarioCatalog';

function createScenarioSessionId(type: ScenarioSession['scenario'], startedAt: string) {
  return `session-${type}-${startedAt.replace(/[:.]/g, '-')}`;
}

function isScenarioExecutionItemForSession(item: ExecutionItem, sessionId: string) {
  return item.id.startsWith(`scenario:${sessionId}:`) || item.id.startsWith(`conditional:${sessionId}:`);
}

function compareSessions(left: ScenarioSession, right: ScenarioSession) {
  return right.startedAt.localeCompare(left.startedAt);
}

export async function startScenarioSession(database: ThirdOfficerDatabase, type: ScenarioSession['scenario'], startedAt: string) {
  await bootstrapDatabase(database);

  const definition = getScenarioDefinition(type);
  const session: ScenarioSession = {
    id: createScenarioSessionId(type, startedAt),
    scenario: type,
    status: 'active',
    startedAt,
    contexts: definition.contexts,
    executionItemIds: [],
    responsibility: definition.responsibility,
    traceability: definition.traceability,
  };

  await database.scenarioSessions.put(session);

  return session;
}

export async function loadScenarioSessions(database: ThirdOfficerDatabase) {
  await bootstrapDatabase(database);

  return (await database.scenarioSessions.toArray()).sort(compareSessions);
}

export async function loadScenarioSessionView(database: ThirdOfficerDatabase, sessionId: string, selectedDate: string, now: string) {
  await bootstrapDatabase(database);

  const session = await database.scenarioSessions.get(sessionId);

  if (!session) {
    return null;
  }

  const views = await loadTaskViews(database, selectedDate, now);
  const sessionViews = views.filter((view) => isScenarioExecutionItemForSession(view.item, sessionId));

  await database.scenarioSessions.update(sessionId, {
    executionItemIds: sessionViews.map((view) => view.item.id),
  });

  return {
    session: (await database.scenarioSessions.get(sessionId)) ?? session,
    views: sessionViews,
  };
}

export async function closeScenarioSession(database: ThirdOfficerDatabase, sessionId: string, endedAt: string) {
  await database.scenarioSessions.update(sessionId, {
    status: 'completed',
    endedAt,
  });
}
