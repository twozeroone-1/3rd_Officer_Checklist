import { APP_VERSION, BACKUP_VERSION } from '../../domain/constants';
import { BackupEnvelopeSchema } from '../../domain/schema';
import type { BackupEnvelope, BackupPayload } from '../../domain/types';

export function exportBackup(payload: BackupPayload): BackupEnvelope {
  return BackupEnvelopeSchema.parse({
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    payload,
  });
}
