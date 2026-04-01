import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { bootstrapDatabase } from '../../lib/db/bootstrap';
import { ThirdOfficerDatabase } from '../../lib/db/client';
import { THEME_STORAGE_KEY, applyTheme } from '../../lib/theme/themeStore';
import { BackupRestoreSection } from './BackupRestoreSection';
import { SettingsPage } from './SettingsPage';
import { exportDatabaseBackup } from './settingsData';

function createTestDatabase(name: string) {
  return new ThirdOfficerDatabase(name);
}

describe('SettingsPage', () => {
  it('persists the selected theme locally', async () => {
    const database = createTestDatabase('settings-theme');
    await bootstrapDatabase(database);

    const view = render(<SettingsPage database={database} />);

    fireEvent.click(await screen.findByLabelText(/트루블랙 야간/i));

    await waitFor(() => {
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('night');
      expect(document.documentElement.dataset.theme).toBe('night');
    });

    view.unmount();
    await database.delete();
  });

  it('restores the backed-up theme into local state and the document when importing a backup', async () => {
    const database = createTestDatabase('settings-theme-restore');
    await bootstrapDatabase(database);
    const exportedEnvelope = await exportDatabaseBackup(database);

    exportedEnvelope.payload.settings = [{ key: 'theme', value: 'night', updatedAt: '2026-04-01T03:20:00.000Z' }];
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    applyTheme('dark');

    const view = render(<BackupRestoreSection database={database} />);

    fireEvent.change(await screen.findByLabelText(/백업 json 가져오기/i), {
      target: {
        files: [new File([JSON.stringify(exportedEnvelope)], 'theme-backup.json', { type: 'application/json' })],
      },
    });

    await waitFor(() => {
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('night');
      expect(document.documentElement.dataset.theme).toBe('night');
    });

    view.unmount();
    await database.delete();
  });
});

describe('BackupRestoreSection', () => {
  it('exports current database state and restores it from imported JSON', async () => {
    const database = createTestDatabase('settings-backup');
    await bootstrapDatabase(database);
    await database.linkedNotes.put({
      id: 'note:backup-test',
      title: 'Anchoring note',
      body: 'Keep anchor watch note in the backup.',
      linkedType: 'task-template',
      linkedId: 'anchoring-preparation',
      status: 'active',
      createdAt: '2026-04-01T03:20:00.000Z',
      updatedAt: '2026-04-01T03:20:00.000Z',
    });

    let exportedBlob: Blob | null = null;
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((value: Blob) => {
        exportedBlob = value;
        return 'blob:backup';
      }),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const view = render(<BackupRestoreSection database={database} />);

    fireEvent.click(await screen.findByRole('button', { name: /백업 json 내보내기/i }));

    await waitFor(() => {
      expect(exportedBlob).not.toBeNull();
    });

    const exportedEnvelope = await exportDatabaseBackup(database);
    expect(exportedEnvelope.payload.linkedNotes.map((note) => note.title)).toContain('Anchoring note');
    await database.linkedNotes.clear();

    fireEvent.change(screen.getByLabelText(/백업 json 가져오기/i), {
      target: {
        files: [new File([JSON.stringify(exportedEnvelope)], 'backup.json', { type: 'application/json' })],
      },
    });

    await waitFor(async () => {
      expect((await database.linkedNotes.get('note:backup-test'))?.title).toBe('Anchoring note');
    });

    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectUrl });
    clickSpy.mockRestore();
    view.unmount();
    await database.delete();
  });

  it('shows a recoverable error for invalid backup input', async () => {
    const database = createTestDatabase('settings-backup-invalid-json');
    await bootstrapDatabase(database);

    const view = render(<BackupRestoreSection database={database} />);

    fireEvent.change(await screen.findByLabelText(/백업 json 가져오기/i), {
      target: {
        files: [new File(['not valid json'], 'invalid.json', { type: 'application/json' })],
      },
    });

    expect(await screen.findByRole('status')).toHaveTextContent(/백업을 가져올 수 없습니다/i);

    view.unmount();
    await database.delete();
  });

  it('shows a recoverable error for schema mismatches and storage failures', async () => {
    const database = createTestDatabase('settings-backup-errors');
    await bootstrapDatabase(database);
    const invalidEnvelope = { version: '1.0.0', exportedAt: new Date().toISOString(), appVersion: '0.1.0', payload: { manuals: [] } };

    const view = render(<BackupRestoreSection database={database} />);

    fireEvent.change(await screen.findByLabelText(/백업 json 가져오기/i), {
      target: {
        files: [new File([JSON.stringify(invalidEnvelope)], 'schema-error.json', { type: 'application/json' })],
      },
    });

    expect(await screen.findByRole('status')).toHaveTextContent(/백업을 가져올 수 없습니다/i);

    const restoreSpy = vi.spyOn(database.manuals, 'clear').mockRejectedValueOnce(new Error('disk full'));
    const validEnvelope = await exportDatabaseBackup(database);

    fireEvent.change(screen.getByLabelText(/백업 json 가져오기/i), {
      target: {
        files: [new File([JSON.stringify(validEnvelope)], 'db-error.json', { type: 'application/json' })],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/disk full/i);
    });

    restoreSpy.mockRestore();
    view.unmount();
    await database.delete();
  });
});
