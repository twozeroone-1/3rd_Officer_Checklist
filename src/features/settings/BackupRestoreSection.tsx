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
    <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Backup</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Backup and restore</h3>
      </div>
      <button
        type="button"
        onClick={() => void handleExport()}
        className="min-h-12 w-full rounded-2xl bg-cyan-300 px-3 text-sm font-semibold text-slate-950"
      >
        Export backup JSON
      </button>
      <label className="block rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
        <span className="font-medium text-white">Import backup JSON</span>
        <input aria-label="Import backup JSON" type="file" accept="application/json" onChange={(event) => void handleImport(event)} className="mt-3 block w-full text-sm text-slate-200" />
      </label>
      {status ? <p role="status" className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">{status}</p> : null}
    </section>
  );
}
