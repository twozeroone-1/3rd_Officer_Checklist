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
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
        Scenario session not found.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.28)]">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Scenario session</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">{formatScenarioTitle(data.session.scenario)} session</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Started {data.session.startedAt.replace('T', ' ').slice(0, 16)} UTC</p>
        <label className="mt-4 block text-sm text-slate-300" htmlFor="scenario-date-picker">
          Session date
        </label>
        <input
          id="scenario-date-picker"
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 text-sm text-white"
        />
        <button
          type="button"
          onClick={() => void handleCloseSession()}
          className="mt-4 min-h-12 w-full rounded-2xl bg-cyan-300 px-3 text-sm font-semibold text-slate-950"
        >
          Complete and close session
        </button>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Generated session work</h3>
        {data.views.length ? (
          data.views.map((view) => <TaskCard key={view.item.id} view={view} onComplete={handleComplete} onOpen={openDetail} />)
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">No generated scenario work for this session date.</p>
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
