import { useEffect, useRef, useState } from 'react';

import { db, type ThirdOfficerDatabase } from '../../lib/db/client';
import { completeExecutionItem, markExecutionItemBlocked, rescheduleExecutionItem, skipExecutionItem } from '../tasks/taskActions';
import { TaskCard } from '../tasks/TaskCard';
import { TaskDetailSheet } from '../tasks/TaskDetailSheet';
import { loadHomeData, loadTaskDetail, type TaskDetailData, type TaskView } from '../tasks/taskData';
import { resolveNow, type NowValue } from '../tasks/time';

type HomePageProps = {
  database?: ThirdOfficerDatabase;
  now?: NowValue;
  initialSelectedDate?: string;
};

function PageSection(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="tactical-list-section">
      <div className="flex items-center justify-between">
        <h2 className="tactical-list-title">{props.title}</h2>
      </div>
      <div className="space-y-3">{props.children}</div>
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="tactical-empty">{label}</p>;
}

export function HomePage({ database = db, now, initialSelectedDate }: HomePageProps) {
  const [selectedDate, setSelectedDate] = useState((initialSelectedDate ?? resolveNow(now)).slice(0, 10));
  const [data, setData] = useState<Awaited<ReturnType<typeof loadHomeData>> | null>(null);
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
      const nextData = await loadHomeData(database, selectedIso, clock);

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
  }, [selectedDate]);

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
    <div className="tactical-page">
      <section className="tactical-panel-strong">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tactical-kicker">Home control</p>
            <h2 className="tactical-title">Today&apos;s duty board</h2>
            <p className="tactical-copy">Operational work stays in front. Documents, notes, and settings remain in the same offline command stack.</p>
          </div>
          <div className="text-right">
            <p className="tactical-meta">Selected date</p>
            <p className="tactical-meta-value">{selectedDate}</p>
          </div>
        </div>

        <div className="mt-5 tactical-stat-grid">
          <div className="tactical-stat">
            <p className="tactical-stat-label">Today</p>
            <p className="tactical-stat-value">{data?.todayTasks.length ?? 0}</p>
          </div>
          <div className="tactical-stat">
            <p className="tactical-stat-label">Due</p>
            <p className="tactical-stat-value">{data?.dueTasks.length ?? 0}</p>
          </div>
          <div className="tactical-stat">
            <p className="tactical-stat-label">Issues</p>
            <p className="tactical-stat-value">{data?.carriedIssues.length ?? 0}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <a href="/scenarios" className="tactical-button-primary flex items-center justify-center">
            Arrival
          </a>
          <a href="/scenarios" className="tactical-button-secondary flex items-center justify-center">
            Departure
          </a>
          <a href="/scenarios" className="tactical-button-ghost flex items-center justify-center">
            Anchoring
          </a>
          <a href="/scenarios" className="tactical-button-ghost flex items-center justify-center">
            In-Port Watch
          </a>
        </div>

        <div className="mt-5">
          <label className="tactical-meta" htmlFor="home-date-picker">
            Selected date
          </label>
          <input
            id="home-date-picker"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="tactical-input mt-3"
          />
        </div>
      </section>

      <PageSection title="Today's tasks">
        {data?.todayTasks.length ? data.todayTasks.map((view) => <TaskCard key={view.item.id} view={view} onComplete={handleComplete} onOpen={openDetail} />) : <EmptyState label="No open watch or daily tasks for this date." />}
      </PageSection>

      <PageSection title="Due weekly/monthly tasks">
        {data?.dueTasks.length ? data.dueTasks.map((view) => <TaskCard key={view.item.id} view={view} onComplete={handleComplete} onOpen={openDetail} />) : <EmptyState label="No weekly or monthly work is due today." />}
      </PageSection>

      <PageSection title="Carried-over issues">
        {data?.carriedIssues.length ? data.carriedIssues.map((view) => <TaskCard key={view.item.id} view={view} onComplete={handleComplete} onOpen={openDetail} />) : <EmptyState label="No blocked tasks are carrying over." />}
      </PageSection>

      <PageSection title="Recent completions">
        {data?.recentCompletions.length ? (
          data.recentCompletions.map(({ log, item }) => (
            <article key={log.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <p className="font-medium text-white">{item?.title ?? log.executionItemId}</p>
              <p className="mt-1 text-slate-400">Completed at {log.recordedAt.replace('T', ' ').slice(0, 16)} UTC</p>
            </article>
          ))
        ) : (
          <EmptyState label="Completions will appear here after the first tap." />
        )}
      </PageSection>

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
