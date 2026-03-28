import fleet12 from '../../data/manuals/fleet-12.json';
import fleet13 from '../../data/manuals/fleet-13.json';
import fleet15 from '../../data/manuals/fleet-15.json';
import fleetI13 from '../../data/manuals/fleet-i13.json';
import fleetI21 from '../../data/manuals/fleet-i21.json';
import { routineTemplates } from '../../data/templates/routineTemplates';
import { scenarioTemplates } from '../../data/templates/scenarioTemplates';
import { ManualDocumentSchema } from '../../domain/schema';
import type { ManualDocument } from '../../domain/types';
import { db, ThirdOfficerDatabase } from './client';
import { SEED_VERSION } from './schema';

const seededManuals: ManualDocument[] = [fleet12, fleet13, fleet15, fleetI13, fleetI21].map((manual) =>
  ManualDocumentSchema.parse(manual),
);

const seededTemplates = [...routineTemplates, ...scenarioTemplates];

export async function bootstrapDatabase(database: ThirdOfficerDatabase = db) {
  await database.open();

  await database.transaction('rw', database.manuals, database.taskTemplates, database.seedState, async () => {
    if ((await database.seedState.get('manuals'))?.version !== SEED_VERSION) {
      await database.manuals.bulkPut(seededManuals);
      await database.seedState.put({ key: 'manuals', version: SEED_VERSION });
    }

    if ((await database.seedState.get('taskTemplates'))?.version !== SEED_VERSION) {
      await database.taskTemplates.bulkPut(seededTemplates);
      await database.seedState.put({ key: 'taskTemplates', version: SEED_VERSION });
    }
  });

  return database;
}
