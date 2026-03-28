import { useEffect, useRef, useState } from 'react';

import { db, type ThirdOfficerDatabase } from '../../lib/db/client';
import { completeExecutionItem, markExecutionItemBlocked, rescheduleExecutionItem, skipExecutionItem } from '../tasks/taskActions';
import { TaskCard } from '../tasks/TaskCard';
import { TaskDetailSheet } from '../tasks/TaskDetailSheet';
import { loadTaskDetail, type TaskDetailData, type TaskView } from '../tasks/taskData';
import { resolveNow, type NowValue } from '../tasks/time';
import { loadCalendarWorkload } from './calendarData';

type CalendarPageProps = {
  database?: ThirdOfficerDatabase;
  now?: NowValue;
};

function WorkloadSection(props: { title: string; empty: string; views: TaskView[]; onComplete: (view: TaskView) => void; onOpen: (view: TaskView) => void }) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">{props.title}</h3>
      {props.views.length ? (
        props.views.map((view) => <TaskCard key={view.item.id} view={view} onComplete={props.onComplete} onOpen={props.onOpen} />)
      ) : (
        <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">{props.empty}</p>
      )}
    </section>
  );
}

export function CalendarPage({ database = db, now }: CalendarPageProps) {
  const [selectedDate, setSelectedDate] = useState(resolveNow(now).slice(0, 10));
  const [data, setData] = useState<Awaited<ReturnType<typeof loadCalendarWorkload>> | null>(null);
  const [activeView, setActiveView] = useState<TaskView | null>(null);
  const [activeDetail, setActiveDetail] = useState<TaskDetailData | null>(null);
  const isMounted = useRef(true);
  const detailTargetId = useRef<string | null>(null);
  const refreshRequestId = useRef(0);

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
    const requestId = refreshRequestId.current + 1;
    refreshRequestId.current = requestId;
    const clock = resolveNow(now);
    const selectedIso = `${selectedDate}T${clock.slice(11)}`;
    try {
      const nextData = await loadCalendarWorkload(database, selectedIso, clock);

      if (isMounted.current && refreshRequestId.current === requestId) {
        setData(nextData);
      }
    } catch (error) {
      if (!isClosedDatabaseError(error)) {
        throw error;
      }
    }
  }

  useEffect(() => {
    void refresh();
  }, [database, selectedDate]);

  async function openDetail(view: TaskView) {
    detailTargetId.current = view.item.id;
    if (isMounted.current) {
      setActiveView(view);
      setActiveDetail(null);
    }

    try {
      const nextDetail = await loadTaskDetail(database, view);

      if (isMounted.current && detailTargetId.current === view.item.id) {
        setActiveDetail(nextDetail);
      }
    } catch (error) {
      if (!isClosedDatabaseError(error)) {
        throw error;
      }
    }
  }

  async function handleComplete(view: TaskView) {
    await completeExecutionItem(database, view.item, resolveNow(now));
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
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Calendar</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Workload by date</h2>
        <label className="mt-4 block text-sm text-slate-300" htmlFor="calendar-date-picker">
          Selected workload date
        </label>
        <input
          id="calendar-date-picker"
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 text-sm text-white"
        />
        <p className="mt-3 rounded-2xl bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
          Selected date changes which workload is generated. Execution actions still record the live UTC timestamp used when you tap complete, skip, or reschedule.
        </p>
      </section>

      <WorkloadSection
        title="Routine due on selected date"
        empty="No routine workload is due on this date."
        views={data?.routineViews ?? []}
        onComplete={handleComplete}
        onOpen={openDetail}
      />
      <WorkloadSection
        title="Active scenario work"
        empty="No active scenario workload is linked to this date."
        views={data?.scenarioViews ?? []}
        onComplete={handleComplete}
        onOpen={openDetail}
      />
      <WorkloadSection
        title="Carry-over work"
        empty="No open carry-over items are rolling into this date."
        views={data?.carryOverViews ?? []}
        onComplete={handleComplete}
        onOpen={openDetail}
      />

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
