import { z } from 'zod';

import {
  BackupEnvelopeSchema,
  BackupPayloadSchema,
  AppSettingSchema,
  CompletionLogSchema,
  ExecutionItemSchema,
  LinkedNoteSchema,
  ManualDocumentSchema,
  ManualExcerptSchema,
  RoutineTaskTemplateSchema,
  ScenarioSessionSchema,
  ScenarioTaskTemplateSchema,
  TaskTemplateSchema,
  TraceabilityLinkSchema,
} from './schema';

export type TraceabilityLink = z.infer<typeof TraceabilityLinkSchema>;
export type ManualExcerpt = z.infer<typeof ManualExcerptSchema>;
export type ManualDocument = z.infer<typeof ManualDocumentSchema>;
export type RoutineTaskTemplate = z.infer<typeof RoutineTaskTemplateSchema>;
export type ScenarioTaskTemplate = z.infer<typeof ScenarioTaskTemplateSchema>;
export type TaskTemplate = z.infer<typeof TaskTemplateSchema>;
export type ExecutionItem = z.infer<typeof ExecutionItemSchema>;
export type CompletionLog = z.infer<typeof CompletionLogSchema>;
export type LinkedNote = z.infer<typeof LinkedNoteSchema>;
export type ScenarioSession = z.infer<typeof ScenarioSessionSchema>;
export type AppSetting = z.infer<typeof AppSettingSchema>;
export type BackupPayload = z.infer<typeof BackupPayloadSchema>;
export type BackupEnvelope = z.infer<typeof BackupEnvelopeSchema>;
