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
    <div className="fixed inset-0 z-20 flex items-end bg-black/78 p-3" onClick={props.onClose}>
      <section
        role="dialog"
        aria-label="Task details"
        className="max-h-[92vh] w-full overflow-auto border border-[color:var(--outline-strong)] bg-[color:var(--surface-low)] p-5 shadow-[0_-20px_60px_rgba(0,0,0,0.56)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-l-4 border-[color:var(--accent-primary)] pl-4">
          <div>
            <p className="tactical-kicker">{currentView.frequency} task detail</p>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-[color:var(--text-primary)]">{currentView.item.title}</h2>
          </div>
          <button type="button" onClick={props.onClose} className="tactical-button-ghost min-h-10 px-4 py-2">
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-[color:var(--text-primary)]">
          <section className="tactical-panel">
            <p className="support-kicker">Summary</p>
            <p className="mt-3 leading-7 text-[color:var(--text-secondary)]">{resolvedDetail.summary}</p>
          </section>

          <section className="tactical-panel">
            <p className="support-kicker">Practical points</p>
            <ul className="mt-2 space-y-2">
              {resolvedDetail.practicalPoints.map((point) => (
                <li key={point} className="border-l-2 border-[color:var(--accent-secondary)] bg-[color:var(--surface-lowest)] px-3 py-3 leading-6 text-[color:var(--text-secondary)]">
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="tactical-panel">
            <p className="support-kicker">Source excerpt</p>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--accent-primary-soft)]">{resolvedDetail.sourceLabel}</p>
            <p className="mt-3 text-base font-black uppercase tracking-tight text-[color:var(--text-primary)]">{resolvedDetail.excerpt?.heading ?? 'No excerpt available'}</p>
            <p className="mt-3 bg-[color:var(--surface-lowest)] px-3 py-3 font-mono leading-7 text-[color:var(--text-secondary)]">{resolvedDetail.excerpt?.body ?? 'This task does not have a stored excerpt yet.'}</p>
          </section>

          <section className="tactical-panel">
            <p className="support-kicker">Linked notes</p>
            <div className="mt-2 space-y-2">
              {resolvedDetail.notes.length === 0 ? <p className="tactical-empty">No linked notes yet.</p> : null}
              {resolvedDetail.notes.map((entry) => (
                <article key={entry.id} className="border-l-2 border-[color:var(--accent-primary)] bg-[color:var(--surface-lowest)] px-3 py-3">
                  <p className="text-sm font-black uppercase tracking-[0.08em] text-[color:var(--text-primary)]">{entry.title}</p>
                  <p className="mt-2 leading-6 text-[color:var(--text-secondary)]">{entry.body}</p>
                </article>
              ))}
            </div>
          </section>

          <label className="tactical-panel block">
            <span className="support-kicker">Issue note</span>
            <textarea
              aria-label="Issue note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="tactical-textarea mt-3"
            />
          </label>

          <label className="tactical-panel block">
            <span className="support-kicker">Change date/time</span>
            <input
              aria-label="Change date/time"
              type="datetime-local"
              value={scheduledFor}
              onChange={(event) => setScheduledFor(event.target.value)}
              className="tactical-input mt-3"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => props.onComplete(currentView)}
              className="tactical-button-primary"
            >
              Complete task
            </button>
            <button
              type="button"
              onClick={() => props.onBlock(currentView, note)}
              className="tactical-button-secondary"
            >
              Mark issue
            </button>
            <button
              type="button"
              onClick={() => props.onSkip(currentView, note)}
              className="tactical-button-ghost"
            >
              Mark skipped
            </button>
            <button
              type="button"
              onClick={handleReschedule}
              className="tactical-button-ghost"
            >
              Save date/time
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
