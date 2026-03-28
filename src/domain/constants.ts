export const APP_NAME = 'Third Officer Assistant';
export const APP_VERSION = '0.1.0';
export const BACKUP_VERSION = '1.0.0';

export const ROUTINE_FREQUENCIES = ['watch', 'daily', 'weekly', 'monthly', 'conditional'] as const;
export const TASK_CONTEXTS = ['sea', 'arrival', 'departure', 'anchoring', 'in-port', 'safety'] as const;
export const CONDITION_TRIGGERS = [
  'before-watch',
  'during-watch',
  'hourly-anchor',
  'before-arrival',
  'before-departure',
  'weekly-safety',
  'monthly-safety',
] as const;
export const RESPONSIBILITIES = ['third-officer', 'bridge-team', 'deck-crew'] as const;
export const TEMPLATE_STATUSES = ['active', 'draft', 'retired'] as const;
export const EXECUTION_STATUSES = ['pending', 'in-progress', 'done', 'blocked', 'skipped'] as const;
export const NOTE_STATUSES = ['active', 'archived'] as const;
export const SESSION_STATUSES = ['planned', 'active', 'completed', 'abandoned'] as const;
export const SCENARIO_TYPES = ['arrival', 'departure', 'anchoring', 'in-port-watch'] as const;
