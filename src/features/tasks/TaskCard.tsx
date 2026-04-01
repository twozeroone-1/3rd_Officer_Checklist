import type { TaskView } from './taskData';

type TaskCardProps = {
  view: TaskView;
  onComplete: (view: TaskView) => void;
  onOpen: (view: TaskView) => void;
};

function getFrequencyLabel(frequency: TaskView['frequency']) {
  switch (frequency) {
    case 'watch':
      return '당직';
    case 'daily':
      return '일간';
    case 'weekly':
      return '주간';
    case 'monthly':
      return '월간';
    case 'conditional':
      return '조건부';
    default:
      return '상황';
  }
}

function getStatusLabel(status: TaskView['item']['status']) {
  switch (status) {
    case 'done':
      return '완료';
    case 'blocked':
      return '이슈';
    case 'skipped':
      return '제외';
    case 'in-progress':
      return '진행';
    default:
      return '예정';
  }
}

function getResponsibilityLabel(value: string) {
  switch (value) {
    case 'third-officer':
      return '삼항사';
    case 'bridge-team':
      return '선교팀';
    default:
      return value;
  }
}

function getStatusTone(status: TaskView['item']['status']) {
  switch (status) {
    case 'done':
      return {
        badge: 'bg-[color:rgba(70,234,237,0.14)] text-[color:var(--accent-secondary)] border-[color:rgba(70,234,237,0.24)]',
        rail: 'bg-[color:var(--accent-secondary)]',
      };
    case 'blocked':
      return {
        badge: 'bg-[color:rgba(147,0,10,0.38)] text-[color:var(--danger)] border-[color:rgba(255,180,171,0.24)]',
        rail: 'bg-[color:var(--danger)]',
      };
    case 'skipped':
      return {
        badge: 'bg-[color:rgba(255,191,0,0.16)] text-[color:var(--accent-primary-soft)] border-[color:rgba(255,191,0,0.22)]',
        rail: 'bg-[color:var(--accent-primary)]',
      };
    case 'in-progress':
      return {
        badge: 'bg-[color:rgba(70,234,237,0.12)] text-[color:var(--accent-secondary)] border-[color:rgba(70,234,237,0.18)]',
        rail: 'bg-[color:var(--accent-secondary)]',
      };
    default:
      return {
        badge: 'bg-[color:var(--surface-high)] text-[color:var(--text-secondary)] border-[color:var(--outline-soft)]',
        rail: 'bg-[color:var(--accent-primary)]',
      };
  }
}

export function TaskCard({ view, onComplete, onOpen }: TaskCardProps) {
  const statusTone = getStatusTone(view.item.status);
  const trace = view.item.traceability[0];

  return (
    <article className="border border-[color:var(--outline-soft)] bg-[color:var(--surface-low)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="flex min-h-40 items-stretch">
        <div className={`w-1.5 ${statusTone.rail}`} />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--accent-secondary)]">{view.frequency}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--accent-secondary)]">{getFrequencyLabel(view.frequency)}</p>
              <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-[color:var(--text-primary)]">{view.item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{view.template?.summary ?? '실행 업무'}</p>
            </div>
            <span className={`border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone.badge}`}>
              {getStatusLabel(view.item.status)}
            </span>
          </div>

          <div className="grid gap-3 text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-faint)] sm:grid-cols-3">
            <div className="border-l-2 border-[color:var(--surface-highest)] pl-3">
              <p className="font-black">근거</p>
              <p className="mt-2 font-mono text-[color:var(--text-primary)]">{trace.documentId} / {trace.sectionRef}</p>
            </div>
            <div className="border-l-2 border-[color:var(--surface-highest)] pl-3">
              <p className="font-black">예정</p>
              <p className="mt-2 font-mono text-[color:var(--text-primary)]">{view.item.scheduledFor.slice(0, 16).replace('T', ' ')}</p>
            </div>
            <div className="border-l-2 border-[color:var(--surface-highest)] pl-3">
              <p className="font-black">담당</p>
              <p className="mt-2 font-mono text-[color:var(--text-primary)]">{getResponsibilityLabel(view.item.responsibility)}</p>
            </div>
          </div>

          {view.item.note ? <p className="border-l-2 border-[color:var(--accent-primary)] bg-[color:var(--surface-lowest)] px-3 py-3 text-sm leading-6 text-[color:var(--accent-primary-soft)]">{view.item.note}</p> : null}

          <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onComplete(view)}
          className="tactical-button-primary"
          aria-label={`${view.item.title} 완료`}
        >
          완료
        </button>
        <button
          type="button"
          onClick={() => onOpen(view)}
          className="tactical-button-ghost"
          aria-label={`${view.item.title} 상세 열기`}
        >
          상세
        </button>
          </div>
        </div>
      </div>
    </article>
  );
}
