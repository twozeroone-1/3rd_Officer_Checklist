import { useEffect, useState } from 'react';

import { formatUtcIsoForDateTimeLocal, parseDateTimeLocalToUtcIso } from './dateTime';
import type { TaskDetailData, TaskView } from './taskData';

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
    sourceLabel: '근거 문서 불러오는 중...',
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
        aria-label="업무 상세"
        className="max-h-[92vh] w-full overflow-auto border border-[color:var(--outline-strong)] bg-[color:var(--surface-low)] p-5 shadow-[0_-20px_60px_rgba(0,0,0,0.56)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-l-4 border-[color:var(--accent-primary)] pl-4">
          <div>
            <p className="tactical-kicker">{getFrequencyLabel(currentView.frequency)} 업무 상세</p>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-[color:var(--text-primary)]">{currentView.item.title}</h2>
          </div>
          <button type="button" onClick={props.onClose} className="tactical-button-ghost min-h-10 px-4 py-2">
            닫기
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-[color:var(--text-primary)]">
          <section className="tactical-panel">
            <p className="support-kicker">요약</p>
            <p className="mt-3 leading-7 text-[color:var(--text-secondary)]">{resolvedDetail.summary}</p>
          </section>

          <section className="tactical-panel">
            <p className="support-kicker">실무 포인트</p>
            <ul className="mt-2 space-y-2">
              {resolvedDetail.practicalPoints.map((point) => (
                <li key={point} className="border-l-2 border-[color:var(--accent-secondary)] bg-[color:var(--surface-lowest)] px-3 py-3 leading-6 text-[color:var(--text-secondary)]">
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="tactical-panel">
            <p className="support-kicker">근거 문서</p>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--accent-primary-soft)]">{resolvedDetail.sourceLabel}</p>
            <p className="mt-3 text-base font-black uppercase tracking-tight text-[color:var(--text-primary)]">{resolvedDetail.excerpt?.heading ?? '저장된 발췌 없음'}</p>
            <p className="mt-3 bg-[color:var(--surface-lowest)] px-3 py-3 font-mono leading-7 text-[color:var(--text-secondary)]">{resolvedDetail.excerpt?.body ?? '이 업무에는 저장된 발췌문이 없습니다.'}</p>
          </section>

          <section className="tactical-panel">
            <p className="support-kicker">연결 메모</p>
            <div className="mt-2 space-y-2">
              {resolvedDetail.notes.length === 0 ? <p className="tactical-empty">연결된 메모가 없습니다.</p> : null}
              {resolvedDetail.notes.map((entry) => (
                <article key={entry.id} className="border-l-2 border-[color:var(--accent-primary)] bg-[color:var(--surface-lowest)] px-3 py-3">
                  <p className="text-sm font-black uppercase tracking-[0.08em] text-[color:var(--text-primary)]">{entry.title}</p>
                  <p className="mt-2 leading-6 text-[color:var(--text-secondary)]">{entry.body}</p>
                </article>
              ))}
            </div>
          </section>

          <label className="tactical-panel block">
            <span className="support-kicker">이슈 메모</span>
            <textarea
              aria-label="이슈 메모"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="tactical-textarea mt-3"
            />
          </label>

          <label className="tactical-panel block">
            <span className="support-kicker">날짜/시간 변경</span>
            <input
              aria-label="날짜/시간 변경"
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
              업무 완료
            </button>
            <button
              type="button"
              onClick={() => props.onBlock(currentView, note)}
              className="tactical-button-secondary"
            >
              이슈 등록
            </button>
            <button
              type="button"
              onClick={() => props.onSkip(currentView, note)}
              className="tactical-button-ghost"
            >
              적용 제외
            </button>
            <button
              type="button"
              onClick={handleReschedule}
              className="tactical-button-ghost"
            >
              일정 저장
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
