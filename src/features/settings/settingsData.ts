import { exportBackup } from '../../lib/backup/exportBackup';
import { importBackup } from '../../lib/backup/importBackup';
import { bootstrapDatabase } from '../../lib/db/bootstrap';
import type { ThirdOfficerDatabase } from '../../lib/db/client';
import { SEED_VERSION } from '../../lib/db/schema';
import { createThemeSetting, saveAndApplyTheme } from '../../lib/theme/themeStore';

function getSettingsRows(themeSetting: { value: 'dark' | 'night'; updatedAt: string } | undefined) {
  return themeSetting ? [createThemeSetting(themeSetting.value, themeSetting.updatedAt)] : [];
}

export async function exportDatabaseBackup(database: ThirdOfficerDatabase) {
  await bootstrapDatabase(database);

  const [manuals, taskTemplates, executionItems, completionLogs, linkedNotes, scenarioSessions, themeSetting] = await Promise.all([
    database.manuals.toArray(),
    database.taskTemplates.toArray(),
    database.executionItems.toArray(),
    database.completionLogs.toArray(),
    database.linkedNotes.toArray(),
    database.scenarioSessions.toArray(),
    database.appSettings.get('theme'),
  ]);

  return exportBackup({
    manuals,
    taskTemplates,
    executionItems,
    completionLogs,
    linkedNotes,
    scenarioSessions,
    settings: getSettingsRows(themeSetting),
  });
}

export async function restoreDatabaseBackup(database: ThirdOfficerDatabase, input: unknown) {
  const envelope = importBackup(input);

  await (database.transaction as unknown as (...args: unknown[]) => Promise<void>)(
    'rw',
    [database.manuals, database.taskTemplates, database.executionItems, database.completionLogs, database.linkedNotes, database.scenarioSessions, database.seedState, database.appSettings],
    async () => {
      await Promise.all([
        database.manuals.clear(),
        database.taskTemplates.clear(),
        database.executionItems.clear(),
        database.completionLogs.clear(),
        database.linkedNotes.clear(),
        database.scenarioSessions.clear(),
        database.appSettings.clear(),
      ]);

      if (envelope.payload.manuals.length > 0) {
        await database.manuals.bulkPut(envelope.payload.manuals);
      }

      if (envelope.payload.taskTemplates.length > 0) {
        await database.taskTemplates.bulkPut(envelope.payload.taskTemplates);
      }

      if (envelope.payload.executionItems.length > 0) {
        await database.executionItems.bulkPut(envelope.payload.executionItems);
      }

      if (envelope.payload.completionLogs.length > 0) {
        await database.completionLogs.bulkPut(envelope.payload.completionLogs);
      }

      if (envelope.payload.linkedNotes.length > 0) {
        await database.linkedNotes.bulkPut(envelope.payload.linkedNotes);
      }

      if (envelope.payload.scenarioSessions.length > 0) {
        await database.scenarioSessions.bulkPut(envelope.payload.scenarioSessions);
      }

      if (envelope.payload.settings.length > 0) {
        await database.appSettings.bulkPut(envelope.payload.settings);
      }

      await database.seedState.bulkPut([
        { key: 'manuals', version: SEED_VERSION },
        { key: 'taskTemplates', version: SEED_VERSION },
      ]);
    },
  );

  const restoredTheme = envelope.payload.settings.find((setting) => setting.key === 'theme');

  if (restoredTheme) {
    saveAndApplyTheme(restoredTheme.value);
  }

  return envelope;
}

export function getBackupImportErrorMessage(error: unknown) {
  if (error instanceof SyntaxError) {
    return 'Unable to import backup. The selected file is not valid JSON.';
  }

  if (error instanceof Error) {
    return `Unable to import backup. ${error.message}`;
  }

  return 'Unable to import backup. Unknown error.';
}
