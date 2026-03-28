import type { TaskView } from './taskData';

type TaskCardProps = {
  view: TaskView;
  onComplete: (view: TaskView) => void;
  onOpen: (view: TaskView) => void;
};

export function TaskCard({ view, onComplete, onOpen }: TaskCardProps) {
  return (
    <article className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_12px_36px_rgba(2,6,23,0.24)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">{view.frequency}</p>
          <h3 className="mt-2 text-base font-semibold text-white">{view.item.title}</h3>
          <p className="mt-1 text-sm text-slate-300">{view.template?.summary ?? 'Execution item'}</p>
          {view.item.note ? <p className="mt-2 text-sm text-amber-100">{view.item.note}</p> : null}
        </div>
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase tracking-[0.2em] text-slate-200">
          {view.item.status}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onComplete(view)}
          className="flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-cyan-300 px-3 text-sm font-semibold text-slate-950"
          aria-label={`Complete ${view.item.title}`}
        >
          Complete
        </button>
        <button
          type="button"
          onClick={() => onOpen(view)}
          className="flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-white/10 px-3 text-sm font-medium text-slate-100"
          aria-label={`Open details for ${view.item.title}`}
        >
          Details
        </button>
      </div>
    </article>
  );
}
