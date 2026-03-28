import Dexie from 'dexie';

import type { RoutineTaskTemplate } from '../../domain/types';
import { ThirdOfficerDatabase } from './client';
import { bootstrapDatabase } from './bootstrap';
import { TABLE_SCHEMAS } from './schema';

function createDatabase(name: string) {
  return new ThirdOfficerDatabase(name);
}

describe('database bootstrap', () => {
  it('seeds manuals and templates on first run', async () => {
    const database = createDatabase('bootstrap-first-run');

    await bootstrapDatabase(database);

    expect(await database.manuals.count()).toBeGreaterThan(0);
    expect(await database.taskTemplates.count()).toBeGreaterThan(0);

    await database.delete();
  });

  it('is idempotent across reopen when seed versions are unchanged', async () => {
    const dbName = 'bootstrap-reopen';
    const firstDatabase = createDatabase(dbName);

    await bootstrapDatabase(firstDatabase);
    const firstManualCount = await firstDatabase.manuals.count();
    const firstTemplateCount = await firstDatabase.taskTemplates.count();
    await firstDatabase.close();

    const reopenedDatabase = createDatabase(dbName);
    await bootstrapDatabase(reopenedDatabase);

    expect(await reopenedDatabase.manuals.count()).toBe(firstManualCount);
    expect(await reopenedDatabase.taskTemplates.count()).toBe(firstTemplateCount);
    expect(await reopenedDatabase.seedState.get('manuals')).toEqual({ key: 'manuals', version: 1 });
    expect(await reopenedDatabase.seedState.get('taskTemplates')).toEqual({ key: 'taskTemplates', version: 1 });

    await reopenedDatabase.delete();
  });

  it('keeps user-created rows while seeded rows are upserted safely', async () => {
    const database = createDatabase('bootstrap-user-data');

    await bootstrapDatabase(database);
    const userTemplate: RoutineTaskTemplate = {
      id: 'user-template',
      title: 'User template',
      category: 'routine',
      summary: 'User-authored task that should survive bootstrap.',
      frequency: 'daily',
      contexts: ['sea'],
      conditionTriggers: ['during-watch'],
      responsibility: 'third-officer',
      status: 'active',
      traceability: [
        {
          documentId: 'fleet-12',
          excerptId: 'fleet-12-watch-handover',
          sectionRef: '4.1',
        },
      ],
    };

    await database.taskTemplates.add(userTemplate);

    await bootstrapDatabase(database);

    expect(await database.taskTemplates.get('user-template')).toBeDefined();
    expect(await database.taskTemplates.count()).toBeGreaterThan(10);

    await database.delete();
  });

  it('re-applies seed rows when stored seed version is outdated', async () => {
    const database = createDatabase('bootstrap-seed-version');

    await bootstrapDatabase(database);
    await database.manuals.update('fleet-12', {
      summary: 'Old summary that should be replaced by seed data.',
    });
    await database.seedState.put({ key: 'manuals', version: 0 });

    await bootstrapDatabase(database);

    expect((await database.manuals.get('fleet-12'))?.summary).not.toBe(
      'Old summary that should be replaced by seed data.',
    );
    expect(await database.seedState.get('manuals')).toEqual({ key: 'manuals', version: 1 });

    await database.delete();
  });

  it('migrates a v1 database forward without losing rows or blocking bootstrap', async () => {
    const dbName = 'bootstrap-migration-safety';
    const legacyDatabase = new Dexie(dbName);

    legacyDatabase.version(1).stores(TABLE_SCHEMAS.v1);
    await legacyDatabase.open();
    await legacyDatabase.table('manuals').put({
      id: 'legacy-manual',
      code: 'LEGACY-1',
      title: 'Legacy Manual',
      revision: '1.0',
      summary: 'Legacy row should survive schema upgrades.',
      source: 'legacy',
      excerpts: [
        {
          id: 'legacy-excerpt',
          heading: 'Legacy heading',
          summary: 'Legacy summary',
          body: 'Legacy body',
          tags: ['legacy'],
          traceability: {
            documentId: 'legacy-manual',
            excerptId: 'legacy-excerpt',
            sectionRef: '1.0',
          },
        },
      ],
    });
    await legacyDatabase.close();

    const database = createDatabase(dbName);

    await bootstrapDatabase(database);

    expect(await database.manuals.get('legacy-manual')).toBeDefined();
    expect(await database.manuals.count()).toBe(6);
    expect(await database.seedState.get('manuals')).toEqual({ key: 'manuals', version: 1 });
    expect(await database.seedState.get('taskTemplates')).toEqual({ key: 'taskTemplates', version: 1 });

    await database.delete();
  });
});
