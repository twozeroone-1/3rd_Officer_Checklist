import { exportBackup } from './exportBackup';
import { importBackup } from './importBackup';

describe('backup helpers', () => {
  it('exports a versioned backup envelope', () => {
    const envelope = exportBackup({
      manuals: [],
      taskTemplates: [],
      executionItems: [],
      completionLogs: [],
      linkedNotes: [],
      scenarioSessions: [],
      settings: [],
    });

    expect(envelope.version).toBe('1.0.0');
    expect(envelope.payload.manuals).toEqual([]);
  });

  it('imports a valid backup and rejects unknown versions', () => {
    const validEnvelope = exportBackup({
      manuals: [],
      taskTemplates: [],
      executionItems: [],
      completionLogs: [],
      linkedNotes: [],
      scenarioSessions: [],
      settings: [],
    });

    expect(importBackup(validEnvelope).payload.taskTemplates).toEqual([]);
    expect(() => importBackup({ ...validEnvelope, version: '9.9.9' })).toThrow(/unsupported backup version/i);
  });

  it('preserves settings rows in the backup payload', () => {
    const envelope = exportBackup({
      manuals: [],
      taskTemplates: [],
      executionItems: [],
      completionLogs: [],
      linkedNotes: [],
      scenarioSessions: [],
      settings: [{ key: 'theme', value: 'night', updatedAt: '2026-04-01T03:20:00.000Z' }],
    });

    expect(importBackup(envelope).payload.settings).toEqual([
      { key: 'theme', value: 'night', updatedAt: '2026-04-01T03:20:00.000Z' },
    ]);
  });

  it('imports older backups that do not include settings rows', () => {
    const imported = importBackup({
      version: '1.0.0',
      exportedAt: '2026-04-01T03:20:00.000Z',
      appVersion: '0.1.0',
      payload: {
        manuals: [],
        taskTemplates: [],
        executionItems: [],
        completionLogs: [],
        linkedNotes: [],
        scenarioSessions: [],
      },
    });

    expect(imported.payload.settings).toEqual([]);
  });
});
