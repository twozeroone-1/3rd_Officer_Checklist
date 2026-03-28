import { z } from 'zod';

import {
  APP_VERSION,
  BACKUP_VERSION,
  CONDITION_TRIGGERS,
  EXECUTION_STATUSES,
  NOTE_STATUSES,
  RESPONSIBILITIES,
  ROUTINE_FREQUENCIES,
  SCENARIO_TYPES,
  SESSION_STATUSES,
  TASK_CONTEXTS,
  TEMPLATE_STATUSES,
} from './constants';

export const TraceabilityLinkSchema = z.object({
  documentId: z.string().min(1),
  excerptId: z.string().min(1),
  sectionRef: z.string().min(1),
});

export const ManualExcerptSchema = z.object({
  id: z.string().min(1),
  heading: z.string().min(1),
  summary: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  traceability: TraceabilityLinkSchema,
});

export const ManualDocumentSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  title: z.string().min(1),
  revision: z.string().min(1),
  summary: z.string().min(1),
  source: z.string().min(1),
  excerpts: z.array(ManualExcerptSchema).min(1),
});

const TaskTemplateBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  contexts: z.array(z.enum(TASK_CONTEXTS)).min(1),
  conditionTriggers: z.array(z.enum(CONDITION_TRIGGERS)).min(1),
  responsibility: z.enum(RESPONSIBILITIES),
  status: z.enum(TEMPLATE_STATUSES),
  traceability: z.array(TraceabilityLinkSchema).min(1),
});

export const RoutineTaskTemplateSchema = TaskTemplateBaseSchema.extend({
  category: z.literal('routine'),
  frequency: z.enum(ROUTINE_FREQUENCIES),
});

export const ScenarioTaskTemplateSchema = TaskTemplateBaseSchema.extend({
  category: z.literal('scenario'),
  scenarioType: z.enum(SCENARIO_TYPES),
});

export const TaskTemplateSchema = z.discriminatedUnion('category', [
  RoutineTaskTemplateSchema,
  ScenarioTaskTemplateSchema,
]);

export const ExecutionItemSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(EXECUTION_STATUSES),
  scheduledFor: z.string().datetime(),
  contexts: z.array(z.enum(TASK_CONTEXTS)).min(1),
  conditionTriggers: z.array(z.enum(CONDITION_TRIGGERS)).min(1),
  responsibility: z.enum(RESPONSIBILITIES),
  traceability: z.array(TraceabilityLinkSchema).min(1),
  completedAt: z.string().datetime().optional(),
  note: z.string().optional(),
});

export const CompletionLogSchema = z.object({
  id: z.string().min(1),
  executionItemId: z.string().min(1),
  status: z.enum(EXECUTION_STATUSES),
  recordedAt: z.string().datetime(),
  note: z.string().optional(),
});

export const LinkedNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  linkedType: z.enum(['manual-excerpt', 'execution-item', 'task-template']),
  linkedId: z.string().min(1),
  status: z.enum(NOTE_STATUSES),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ScenarioSessionSchema = z.object({
  id: z.string().min(1),
  scenario: z.enum(SCENARIO_TYPES),
  status: z.enum(SESSION_STATUSES),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  contexts: z.array(z.enum(TASK_CONTEXTS)).min(1),
  executionItemIds: z.array(z.string().min(1)),
  responsibility: z.enum(RESPONSIBILITIES),
  traceability: z.array(TraceabilityLinkSchema).min(1),
});

export const AppSettingSchema = z.object({
  key: z.literal('theme'),
  value: z.enum(['dark', 'night']),
  updatedAt: z.string().datetime(),
});

export const BackupPayloadSchema = z.object({
  manuals: z.array(ManualDocumentSchema),
  taskTemplates: z.array(TaskTemplateSchema),
  executionItems: z.array(ExecutionItemSchema),
  completionLogs: z.array(CompletionLogSchema),
  linkedNotes: z.array(LinkedNoteSchema),
  scenarioSessions: z.array(ScenarioSessionSchema),
  settings: z.array(AppSettingSchema).default([]),
});

export const BackupEnvelopeSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string().datetime(),
  appVersion: z.string().default(APP_VERSION),
  payload: BackupPayloadSchema,
});
