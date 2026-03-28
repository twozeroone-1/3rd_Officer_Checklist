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
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.28)]">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Notes</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Bridge notes</h2>
      </section>

      <form onSubmit={handleFreeSubmit} className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold text-white">Free note</h3>
        <input value={freeTitle} onChange={(event) => setFreeTitle(event.target.value)} placeholder="Title" className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 text-white" />
        <textarea value={freeBody} onChange={(event) => setFreeBody(event.target.value)} placeholder="Write a free bridge note" className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-white" />
        <button type="submit" className="min-h-12 w-full rounded-2xl bg-cyan-300 px-3 text-sm font-semibold text-slate-950">Save free note</button>
      </form>

      <form onSubmit={handleLinkedSubmit} className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold text-white">Task-linked note</h3>
        <select value={linkedId} onChange={(event) => setLinkedId(event.target.value)} className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 text-white">
          {targets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.title}
            </option>
          ))}
        </select>
        <input value={linkedTitle} onChange={(event) => setLinkedTitle(event.target.value)} placeholder="Title" className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 text-white" />
        <textarea value={linkedBody} onChange={(event) => setLinkedBody(event.target.value)} placeholder="Write a linked note" className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-white" />
        <button
          type="submit"
          disabled={!linkedId}
          className="min-h-12 w-full rounded-2xl bg-cyan-300 px-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
        >
          Save linked note
        </button>
      </form>

      <section className="space-y-3">
        {notes.map((note) => (
          <article key={note.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">{note.linkedType}</p>
            <h3 className="mt-2 text-base font-semibold text-white">{note.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{note.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
