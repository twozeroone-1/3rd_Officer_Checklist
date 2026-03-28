import { BACKUP_VERSION } from '../../domain/constants';
import { BackupEnvelopeSchema } from '../../domain/schema';
import type { BackupEnvelope } from '../../domain/types';

export function importBackup(input: unknown): BackupEnvelope {
  const parsed = BackupEnvelopeSchema.safeParse(input);

  if (!parsed.success) {
    const hasVersion = typeof input === 'object' && input !== null && 'version' in input;
    if (hasVersion && (input as { version?: string }).version !== BACKUP_VERSION) {
      throw new Error('Unsupported backup version');
    }

    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid backup envelope');
  }

  return parsed.data;
}
