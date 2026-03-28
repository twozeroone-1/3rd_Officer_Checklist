import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { bootstrapDatabase } from '../../lib/db/bootstrap';
import { ThirdOfficerDatabase } from '../../lib/db/client';
import { NotesPage } from './NotesPage';

function createTestDatabase(name: string) {
  return new ThirdOfficerDatabase(name);
}

describe('NotesPage', () => {
  it('creates unique note ids when multiple notes are saved in one session', async () => {
    const database = createTestDatabase('notes-page-unique-ids');
    await bootstrapDatabase(database);
    let now = '2026-04-01T08:30:00.000Z';

    const view = render(<NotesPage database={database} now={() => now} />);

    fireEvent.change((await screen.findAllByPlaceholderText(/title/i))[0], { target: { value: 'First note' } });
    fireEvent.change(screen.getByPlaceholderText(/write a free bridge note/i), { target: { value: 'First body' } });
    fireEvent.click(screen.getByRole('button', { name: /save free note/i }));

    await waitFor(async () => {
      expect(await database.linkedNotes.count()).toBe(1);
    });

    now = '2026-04-01T08:30:01.000Z';
    fireEvent.change(screen.getAllByPlaceholderText(/title/i)[0], { target: { value: 'Second note' } });
    fireEvent.change(screen.getByPlaceholderText(/write a free bridge note/i), { target: { value: 'Second body' } });
    fireEvent.click(screen.getByRole('button', { name: /save free note/i }));

    await waitFor(async () => {
      expect(await database.linkedNotes.count()).toBe(2);
    });

    const notes = await database.linkedNotes.toArray();

    expect(new Set(notes.map((note) => note.id)).size).toBe(2);

    view.unmount();
    await database.delete();
  });

  it('creates task-linked notes against generated task targets on first open', async () => {
    const database = createTestDatabase('notes-page-linked-targets');
    await bootstrapDatabase(database);

    const view = render(<NotesPage database={database} now="2026-04-01T08:30:00.000Z" />);

    const targetSelect = await screen.findByRole('combobox');
    const saveLinkedButton = screen.getByRole('button', { name: /save linked note/i });

    await waitFor(() => {
      expect(targetSelect).not.toHaveValue('');
      expect(saveLinkedButton).toBeEnabled();
    });

    fireEvent.change(screen.getAllByPlaceholderText(/title/i)[1], { target: { value: 'Linked note' } });
    fireEvent.change(screen.getByPlaceholderText(/write a linked note/i), { target: { value: 'Check radar repeater.' } });
    fireEvent.click(saveLinkedButton);

    await waitFor(async () => {
      expect(await database.linkedNotes.count()).toBe(1);
    });

    const [note] = await database.linkedNotes.toArray();
    expect(note.linkedType).toBe('execution-item');
    expect(note.linkedId).not.toBe('');

    view.unmount();
    await database.delete();
  });
});
