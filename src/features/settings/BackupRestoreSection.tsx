import { ChangeEvent, useState } from 'react';

import { db, type ThirdOfficerDatabase } from '../../lib/db/client';
import { exportDatabaseBackup, getBackupImportErrorMessage, restoreDatabaseBackup } from './settingsData';

type BackupRestoreSectionProps = {
  database?: ThirdOfficerDatabase;
};

async function readFileText(file: File) {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read backup file'));
    reader.readAsText(file);
  });
}

export function BackupRestoreSection({ database = db }: BackupRestoreSectionProps) {
  const [status, setStatus] = useState('');
  const isError = status.toLowerCase().startsWith('unable');

  async function handleExport() {
    try {
      const envelope = await exportDatabaseBackup(database);
      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = `third-officer-backup-${envelope.exportedAt.slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus(`Exported backup ${anchor.download}`);
    } catch (error) {
      setStatus(getBackupImportErrorMessage(error));
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await readFileText(file);
      const parsed = JSON.parse(text) as unknown;
      const envelope = await restoreDatabaseBackup(database, parsed);
      setStatus(`Imported backup from ${envelope.exportedAt}`);
    } catch (error) {
      setStatus(getBackupImportErrorMessage(error));
    } finally {
      event.target.value = '';
    }
  }

  return (
    <section className="support-panel space-y-3">
      <div>
        <p className="support-kicker">Backup</p>
        <h3 className="mt-2 text-lg font-black text-[color:var(--text-primary)]">Backup and restore</h3>
      </div>
      <button
        type="button"
        onClick={() => void handleExport()}
        className="tactical-button-secondary w-full"
      >
        Export backup JSON
      </button>
      <label className="block border border-[color:var(--outline-soft)] bg-[color:var(--surface-lowest)] px-4 py-3 text-sm text-[color:var(--text-secondary)]">
        <span className="font-black uppercase tracking-[0.12em] text-[color:var(--text-primary)]">Import backup JSON</span>
        <input aria-label="Import backup JSON" type="file" accept="application/json" onChange={(event) => void handleImport(event)} className="mt-3 block w-full text-sm text-[color:var(--text-primary)]" />
      </label>
      {status ? (
        <p
          role="status"
          className={[
            'border px-4 py-3 text-sm',
            isError
              ? 'border-[color:rgba(255,180,171,0.24)] bg-[color:rgba(147,0,10,0.26)] text-[color:var(--danger)]'
              : 'border-[color:rgba(70,234,237,0.24)] bg-[color:rgba(70,234,237,0.12)] text-[color:var(--accent-secondary)]',
          ].join(' ')}
        >
          {status}
        </p>
      ) : null}
    </section>
  );
}
