import { useEffect, useRef, useState } from 'react';

import { db, type ThirdOfficerDatabase } from '../../lib/db/client';
import { completeExecutionItem, markExecutionItemBlocked, rescheduleExecutionItem, skipExecutionItem } from '../tasks/taskActions';
import { TaskCard } from '../tasks/TaskCard';
import { TaskDetailSheet } from '../tasks/TaskDetailSheet';
import { loadTaskDetail, loadTaskViews, type TaskDetailData, type TaskView } from '../tasks/taskData';
import { resolveNow, type NowValue } from '../tasks/time';

type RoutinePageProps = {
  database?: ThirdOfficerDatabase;
  now?: NowValue;
};

const groups: Array<TaskView['frequency']> = ['watch', 'daily', 'weekly', 'monthly', 'conditional'];

export function RoutinePage({ database = db, now }: RoutinePageProps) {
  const [selectedDate, setSelectedDate] = useState(resolveNow(now).slice(0, 10));
  const [views, setViews] = useState<TaskView[]>([]);
  const [activeView, setActiveView] = useState<TaskView | null>(null);
  const [activeDetail, setActiveDetail] = useState<TaskDetailData | null>(null);
  const detailTargetId = useRef<string | null>(null);
  const refreshRequestId = useRef(0);

  async function refresh() {
    const requestId = refreshRequestId.current + 1;
    refreshRequestId.current = requestId;
    const clock = resolveNow(now);
    const selectedIso = `${selectedDate}T${clock.slice(11)}`;
    const nextViews = (await loadTaskViews(database, selectedIso, clock)).filter(
      (view) => view.template?.category !== 'scenario',
    );

    if (refreshRequestId.current === requestId) {
      setViews(nextViews);
    }
  }

  useEffect(() => {
    void refresh();
  }, [selectedDate]);

  async function openDetail(view: TaskView) {
    detailTargetId.current = view.item.id;
    setActiveView(view);
    setActiveDetail(null);

    const nextDetail = await loadTaskDetail(database, view);

    if (detailTargetId.current === view.item.id) {
      setActiveDetail(nextDetail);
    }
  }

  async function handleComplete(view: TaskView) {
    const clock = resolveNow(now);
    await completeExecutionItem(database, view.item, clock);
    await refresh();
    detailTargetId.current = null;
    setActiveView(null);
    setActiveDetail(null);
  }

  async function handleBlock(view: TaskView, note: string) {
    await markExecutionItemBlocked(database, view.item, note);
    await refresh();
    detailTargetId.current = null;
    setActiveView(null);
    setActiveDetail(null);
  }

  async function handleSkip(view: TaskView, note: string) {
    await skipExecutionItem(database, view.item, note);
    await refresh();
    detailTargetId.current = null;
    setActiveView(null);
    setActiveDetail(null);
  }

  async function handleReschedule(view: TaskView, scheduledFor: string, note: string) {
    await rescheduleExecutionItem(database, view.item, scheduledFor, note);
    await refresh();
    detailTargetId.current = null;
    setActiveView(null);
    setActiveDetail(null);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.28)]">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Routine</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Checks by frequency</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="mt-4 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 text-sm text-white"
        />
      </section>

      {groups.map((group) => {
        const entries = views.filter((view) => view.frequency === group);
        return (
          <section key={group} className="space-y-3">
            <h3 className="text-lg font-semibold capitalize text-white">{group}</h3>
            {entries.length ? (
              entries.map((view) => <TaskCard key={view.item.id} view={view} onComplete={handleComplete} onOpen={openDetail} />)
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                No {group} routine items on this date.
              </p>
            )}
          </section>
        );
      })}

      <TaskDetailSheet
        view={activeView}
        detail={activeDetail}
        onClose={() => {
          detailTargetId.current = null;
          setActiveView(null);
          setActiveDetail(null);
        }}
        onComplete={handleComplete}
        onBlock={handleBlock}
        onSkip={handleSkip}
        onReschedule={handleReschedule}
      />
    </div>
  );
}
