import Dexie, { type EntityTable } from 'dexie';

import type {
  CompletionLog,
  ExecutionItem,
  AppSetting,
  LinkedNote,
  ManualDocument,
  ScenarioSession,
  TaskTemplate,
} from '../../domain/types';
import { applyMigrations } from './migrations';
import { DB_NAME } from './schema';

export type SeedState = {
  key: 'manuals' | 'taskTemplates';
  version: number;
};

export class ThirdOfficerDatabase extends Dexie {
  manuals!: EntityTable<ManualDocument, 'id'>;
  taskTemplates!: EntityTable<TaskTemplate, 'id'>;
  executionItems!: EntityTable<ExecutionItem, 'id'>;
  completionLogs!: EntityTable<CompletionLog, 'id'>;
  linkedNotes!: EntityTable<LinkedNote, 'id'>;
  scenarioSessions!: EntityTable<ScenarioSession, 'id'>;
  seedState!: EntityTable<SeedState, 'key'>;
  appSettings!: EntityTable<AppSetting, 'key'>;

  constructor(name = DB_NAME) {
    super(name);
    applyMigrations(this);
  }
}

export const db = new ThirdOfficerDatabase();
