import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { db, type ThirdOfficerDatabase } from '../../lib/db/client';
import { completeExecutionItem, markExecutionItemBlocked, rescheduleExecutionItem, skipExecutionItem } from '../tasks/taskActions';
import { TaskCard } from '../tasks/TaskCard';
import { TaskDetailSheet } from '../tasks/TaskDetailSheet';
import { loadTaskDetail, type TaskDetailData, type TaskView } from '../tasks/taskData';
import { resolveNow, type NowValue } from '../tasks/time';
import { formatScenarioTitle } from './scenarioCatalog';
import { closeScenarioSession, loadScenarioSessionView } from './scenarioSessionData';

type ScenarioSessionPageProps = {
  database?: ThirdOfficerDatabase;
  now?: NowValue;
  sessionId?: string;
};

export function ScenarioSessionPage({ database = db, now, sessionId: sessionIdProp }: ScenarioSessionPageProps) {
  const navigate = useNavigate();
  const params = useParams();
  const sessionId = sessionIdProp ?? params.sessionId ?? '';
  const [selectedDate, setSelectedDate] = useState(resolveNow(now).slice(0, 10));
  const [data, setData] = useState<Awaited<ReturnType<typeof loadScenarioSessionView>>>(null);
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
      const nextData = await loadScenarioSessionView(database, sessionId, selectedIso, clock);

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
  }, [database, sessionId, selectedDate]);

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

  async function handleCloseSession() {
    await closeScenarioSession(database, sessionId, resolveNow(now));
    await navigate('/scenarios');
  }

  if (!data) {
    return (
      <section className="tactical-panel text-sm text-[color:var(--text-secondary)]">
        Scenario session not found.
      </section>
    );
  }

  const completedCount = data.views.filter((view) => view.item.status === 'done').length;
  const blockedCount = data.views.filter((view) => view.item.status === 'blocked').length;
  const openCount = data.views.length - completedCount - blockedCount;
  const blockedViews = data.views.filter((view) => view.item.status === 'blocked');

  return (
    <div className="tactical-page">
      <section className="tactical-panel-strong">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tactical-kicker">Scenario session</p>
            <h2 className="tactical-title">{formatScenarioTitle(data.session.scenario)} session</h2>
            <p className="tactical-copy">Started {data.session.startedAt.replace('T', ' ').slice(0, 16)} UTC</p>
          </div>
          <div className="text-right">
            <p className="tactical-meta">Generated tasks</p>
            <p className="tactical-meta-value">{data.views.length}</p>
          </div>
        </div>
        <div className="mt-4 tactical-stat-grid">
          <div className="tactical-stat">
            <p className="tactical-stat-label">Open</p>
            <p className="tactical-stat-value">{openCount}</p>
          </div>
          <div className="tactical-stat">
            <p className="tactical-stat-label">Done</p>
            <p className="tactical-stat-value">{completedCount}</p>
          </div>
          <div className="tactical-stat">
            <p className="tactical-stat-label">Blocked</p>
            <p className="tactical-stat-value">{blockedCount}</p>
          </div>
        </div>
        <label className="tactical-meta mt-5 block" htmlFor="scenario-date-picker">
          Session date
        </label>
        <input
          id="scenario-date-picker"
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="tactical-input mt-3"
        />
        <button
          type="button"
          onClick={() => void handleCloseSession()}
          className="tactical-button-primary mt-4 w-full"
        >
          Complete and close session
        </button>
      </section>

      {blockedViews.length ? (
        <section className="tactical-panel border-l-4 border-[color:var(--danger)]">
          <p className="tactical-kicker" style={{ color: 'var(--danger)' }}>
            High-risk unresolved
          </p>
          <div className="mt-3 space-y-3">
            {blockedViews.map((view) => (
              <article key={view.item.id} className="border border-[color:rgba(255,180,171,0.22)] bg-[color:rgba(147,0,10,0.28)] px-3 py-3">
                <p className="text-sm font-black uppercase tracking-tight text-[color:var(--text-primary)]">{view.item.title}</p>
                {view.item.note ? <p className="mt-2 text-sm leading-6 text-[color:var(--danger)]">{view.item.note}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="tactical-list-section">
        <h3 className="tactical-list-title">Generated session work</h3>
        {data.views.length ? (
          data.views.map((view) => <TaskCard key={view.item.id} view={view} onComplete={handleComplete} onOpen={openDetail} />)
        ) : (
          <p className="tactical-empty">No generated scenario work for this session date.</p>
        )}
      </section>

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
