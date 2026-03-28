import { useEffect, useState } from 'react';

import { formatUtcIsoForDateTimeLocal, parseDateTimeLocalToUtcIso } from './dateTime';
import type { TaskDetailData, TaskView } from './taskData';

type TaskDetailSheetProps = {
  view: TaskView | null;
  detail: TaskDetailData | null;
  onClose: () => void;
  onComplete: (view: TaskView) => void;
  onBlock: (view: TaskView, note: string) => void;
  onSkip: (view: TaskView, note: string) => void;
  onReschedule: (view: TaskView, scheduledFor: string, note: string) => void;
};

export function TaskDetailSheet(props: TaskDetailSheetProps) {
  const { view, detail } = props;
  const [note, setNote] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');

  useEffect(() => {
    setNote(view?.item.note ?? '');
    setScheduledFor(view ? formatUtcIsoForDateTimeLocal(view.item.scheduledFor) : '');
  }, [view]);

  if (!view) {
    return null;
  }

  const currentView = view;

  const resolvedDetail: TaskDetailData = detail ?? {
    summary: view.template?.summary ?? view.item.title,
    practicalPoints: [],
    excerpt: null,
    sourceLabel: 'Loading source excerpt...',
    notes: [],
  };

  function handleReschedule() {
    if (!scheduledFor) {
      return;
    }

    try {
      props.onReschedule(currentView, parseDateTimeLocalToUtcIso(scheduledFor), note);
    } catch {
      return;
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-slate-950/70 p-3" onClick={props.onClose}>
      <section
        role="dialog"
        aria-label="Task details"
        className="max-h-[92vh] w-full overflow-auto rounded-[2rem] border border-white/10 bg-slate-950 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">{currentView.frequency}</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{currentView.item.title}</h2>
          </div>
          <button type="button" onClick={props.onClose} className="rounded-full bg-white/10 px-3 py-2 text-sm">
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-slate-200">
          <section className="rounded-2xl bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-white">Summary</h3>
            <p className="mt-2 leading-6">{resolvedDetail.summary}</p>
          </section>

          <section className="rounded-2xl bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-white">Practical points</h3>
            <ul className="mt-2 space-y-2">
              {resolvedDetail.practicalPoints.map((point) => (
                <li key={point} className="rounded-2xl bg-white/5 px-3 py-2">
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-white">Source excerpt</h3>
            <p className="mt-2 text-cyan-100">{resolvedDetail.sourceLabel}</p>
              <p className="mt-2 font-medium text-white">{resolvedDetail.excerpt?.heading ?? 'No excerpt available'}</p>
            <p className="mt-2 leading-6 text-slate-300">{resolvedDetail.excerpt?.body ?? 'This task does not have a stored excerpt yet.'}</p>
          </section>

          <section className="rounded-2xl bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-white">Linked notes</h3>
            <div className="mt-2 space-y-2">
              {resolvedDetail.notes.length === 0 ? <p className="text-slate-400">No linked notes yet.</p> : null}
              {resolvedDetail.notes.map((entry) => (
                <article key={entry.id} className="rounded-2xl bg-white/5 px-3 py-2">
                  <p className="font-medium text-white">{entry.title}</p>
                  <p className="mt-1 text-slate-300">{entry.body}</p>
                </article>
              ))}
            </div>
          </section>

          <label className="block rounded-2xl bg-white/5 p-4">
            <span className="text-sm font-semibold text-white">Issue note</span>
            <textarea
              aria-label="Issue note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white"
            />
          </label>

          <label className="block rounded-2xl bg-white/5 p-4">
            <span className="text-sm font-semibold text-white">Change date/time</span>
            <input
              aria-label="Change date/time"
              type="datetime-local"
              value={scheduledFor}
              onChange={(event) => setScheduledFor(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm text-white"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
               onClick={() => props.onComplete(currentView)}
              className="min-h-12 rounded-2xl bg-cyan-300 px-3 text-sm font-semibold text-slate-950"
            >
              Complete task
            </button>
            <button
              type="button"
               onClick={() => props.onBlock(currentView, note)}
              className="min-h-12 rounded-2xl bg-amber-300 px-3 text-sm font-semibold text-slate-950"
            >
              Mark issue
            </button>
            <button
              type="button"
               onClick={() => props.onSkip(currentView, note)}
              className="min-h-12 rounded-2xl bg-white/10 px-3 text-sm font-medium text-white"
            >
              Mark skipped
            </button>
            <button
              type="button"
              onClick={handleReschedule}
              className="min-h-12 rounded-2xl bg-white/10 px-3 text-sm font-medium text-white"
            >
              Save date/time
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
