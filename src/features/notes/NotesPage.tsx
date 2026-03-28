import { FormEvent, useEffect, useRef, useState } from 'react';

import type { LinkedNote } from '../../domain/types';
import { db, type ThirdOfficerDatabase } from '../../lib/db/client';
import { bootstrapDatabase } from '../../lib/db/bootstrap';
import { loadNoteTargets } from '../tasks/taskData';
import { resolveNow, type NowValue } from '../tasks/time';

type NotesPageProps = {
  database?: ThirdOfficerDatabase;
  now?: NowValue;
};

function createNoteId(timestamp: string, suffix: string) {
  return `note:${suffix}:${timestamp}:${crypto.randomUUID()}`;
}

export function NotesPage({ database = db, now }: NotesPageProps) {
  const [notes, setNotes] = useState<LinkedNote[]>([]);
  const [targets, setTargets] = useState<Awaited<ReturnType<typeof loadNoteTargets>>>([]);
  const [freeTitle, setFreeTitle] = useState('');
  const [freeBody, setFreeBody] = useState('');
  const [linkedTitle, setLinkedTitle] = useState('');
  const [linkedBody, setLinkedBody] = useState('');
  const [linkedId, setLinkedId] = useState('');
  const isMounted = useRef(true);
  const freeNotes = notes.filter((note) => note.linkedId === 'free-note').length;
  const linkedNotes = notes.length - freeNotes;

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  function isClosedDatabaseError(error: unknown) {
    return error instanceof Error && error.name === 'DatabaseClosedError';
  }

  async function refresh() {
    try {
      await bootstrapDatabase(database);
      const [loadedNotes, loadedTargets] = await Promise.all([
        database.linkedNotes.toArray(),
        loadNoteTargets(database, resolveNow(now)),
      ]);

      if (!isMounted.current) {
        return;
      }

      setNotes(loadedNotes);
      setTargets(loadedTargets);
      setLinkedId((current) => current || loadedTargets[0]?.id || '');
    } catch (error) {
      if (!isClosedDatabaseError(error)) {
        throw error;
      }
    }
  }

  useEffect(() => {
    void refresh();
  }, [database]);

  async function handleFreeSubmit(event: FormEvent) {
    event.preventDefault();
    const clock = resolveNow(now);
    await database.linkedNotes.put({
      id: createNoteId(clock, 'free'),
      title: freeTitle,
      body: freeBody,
      linkedType: 'task-template',
      linkedId: 'free-note',
      status: 'active',
      createdAt: clock,
      updatedAt: clock,
    });
    setFreeTitle('');
    setFreeBody('');
    await refresh();
  }

  async function handleLinkedSubmit(event: FormEvent) {
    event.preventDefault();
    if (!linkedId) {
      return;
    }

    const clock = resolveNow(now);
    await database.linkedNotes.put({
      id: createNoteId(clock, 'linked'),
      title: linkedTitle,
      body: linkedBody,
      linkedType: 'execution-item',
      linkedId,
      status: 'active',
      createdAt: clock,
      updatedAt: clock,
    });
    setLinkedTitle('');
    setLinkedBody('');
    await refresh();
  }

  return (
    <div className="tactical-page">
      <section className="support-panel">
        <p className="support-kicker">Notes</p>
        <h2 className="support-title">Bridge notes</h2>
        <p className="support-copy">Store free notes and task-linked handover notes in the same onboard visual language without making this screen feel as intense as the action screens.</p>
        <div className="mt-4 support-stat-grid">
          <div className="support-stat">
            <p className="support-stat-label">Total</p>
            <p className="support-stat-value">{notes.length}</p>
          </div>
          <div className="support-stat">
            <p className="support-stat-label">Free</p>
            <p className="support-stat-value">{freeNotes}</p>
          </div>
          <div className="support-stat">
            <p className="support-stat-label">Linked</p>
            <p className="support-stat-value">{linkedNotes}</p>
          </div>
        </div>
      </section>

      <form onSubmit={handleFreeSubmit} className="support-panel space-y-3">
        <p className="support-kicker">Free note</p>
        <h3 className="tactical-support-title">General bridge memo</h3>
        <input value={freeTitle} onChange={(event) => setFreeTitle(event.target.value)} placeholder="Title" className="tactical-input" />
        <textarea value={freeBody} onChange={(event) => setFreeBody(event.target.value)} placeholder="Write a free bridge note" className="tactical-textarea" />
        <button type="submit" className="tactical-button-secondary w-full">Save free note</button>
      </form>

      <form onSubmit={handleLinkedSubmit} className="support-panel space-y-3">
        <p className="support-kicker">Task-linked note</p>
        <h3 className="tactical-support-title">Attach to execution item</h3>
        <select value={linkedId} onChange={(event) => setLinkedId(event.target.value)} className="tactical-select">
          {targets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.title}
            </option>
          ))}
        </select>
        <input value={linkedTitle} onChange={(event) => setLinkedTitle(event.target.value)} placeholder="Title" className="tactical-input" />
        <textarea value={linkedBody} onChange={(event) => setLinkedBody(event.target.value)} placeholder="Write a linked note" className="tactical-textarea" />
        <button
          type="submit"
          disabled={!linkedId}
          className="tactical-button-secondary w-full disabled:cursor-not-allowed disabled:border-[color:var(--outline-soft)] disabled:bg-[color:var(--surface-high)] disabled:text-[color:var(--text-muted)]"
        >
          Save linked note
        </button>
      </form>

      <section className="tactical-list-section">
        {notes.length ? (
          notes.map((note) => (
            <article key={note.id} className="support-panel border-l-2 border-[color:var(--accent-primary)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="support-kicker">{note.linkedType}</p>
                  <h3 className="mt-2 text-base font-black uppercase tracking-tight text-[color:var(--text-primary)]">{note.title}</h3>
                </div>
                <p className="tactical-meta">{note.updatedAt.slice(0, 10)}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{note.body}</p>
            </article>
          ))
        ) : (
          <p className="tactical-empty">No notes yet. Save a bridge memo or a task-linked handover note.</p>
        )}
      </section>
    </div>
  );
}
