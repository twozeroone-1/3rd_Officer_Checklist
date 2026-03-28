import type Dexie from 'dexie';

import { DB_VERSION, TABLE_SCHEMAS } from './schema';

export function applyMigrations(db: Dexie) {
  db.version(1).stores(TABLE_SCHEMAS.v1);
  if (DB_VERSION >= 2) {
    db.version(2).stores(TABLE_SCHEMAS.v2);
  }
  if (DB_VERSION >= 3) {
    db.version(3).stores(TABLE_SCHEMAS.v3);
  }
}
