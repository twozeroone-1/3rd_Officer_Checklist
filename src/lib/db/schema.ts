export const DB_NAME = 'third-officer-assistant';
export const DB_VERSION = 3;
export const SEED_VERSION = 1;

export const TABLE_SCHEMAS = {
  v1: {
    manuals: '&id, code',
    taskTemplates: '&id, category, status, frequency',
    executionItems: '&id, templateId, status, scheduledFor',
    completionLogs: '&id, executionItemId, recordedAt',
    linkedNotes: '&id, linkedId, linkedType, status',
    scenarioSessions: '&id, scenario, status, startedAt',
  },
  v2: {
    manuals: '&id, code',
    taskTemplates: '&id, category, status, frequency, scenarioType',
    executionItems: '&id, templateId, status, scheduledFor',
    completionLogs: '&id, executionItemId, recordedAt',
    linkedNotes: '&id, linkedId, linkedType, status',
    scenarioSessions: '&id, scenario, status, startedAt',
    seedState: '&key, version',
  },
  v3: {
    manuals: '&id, code',
    taskTemplates: '&id, category, status, frequency, scenarioType',
    executionItems: '&id, templateId, status, scheduledFor',
    completionLogs: '&id, executionItemId, recordedAt',
    linkedNotes: '&id, linkedId, linkedType, status',
    scenarioSessions: '&id, scenario, status, startedAt',
    seedState: '&key, version',
    appSettings: '&key, updatedAt',
  },
} as const;
