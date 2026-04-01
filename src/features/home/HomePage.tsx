import { useEffect, useRef, useState } from 'react';

import type { ScenarioSession } from '../../domain/types';
import { db, type ThirdOfficerDatabase } from '../../lib/db/client';
import { completeExecutionItem, markExecutionItemBlocked, rescheduleExecutionItem, skipExecutionItem } from '../tasks/taskActions';
import { TaskCard } from '../tasks/TaskCard';
import { TaskDetailSheet } from '../tasks/TaskDetailSheet';
import { loadHomeData, loadTaskDetail, type TaskDetailData, type TaskView } from '../tasks/taskData';
import { resolveNow, type NowValue } from '../tasks/time';
import { startScenarioSession } from '../scenarios/scenarioSessionData';

type HomePageProps = {
  database?: ThirdOfficerDatabase;
  now?: NowValue;
  initialSelectedDate?: string;
  onScenarioStarted?: (sessionId: string) => void | Promise<void>;
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

export function HomePage({ database = db, now, initialSelectedDate, onScenarioStarted }: HomePageProps) {
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

  async function handleStartScenario(scenario: ScenarioSession['scenario']) {
    const session = await startScenarioSession(database, scenario, resolveNow(now));

    if (onScenarioStarted) {
      await onScenarioStarted(session.id);
      return;
    }

    await refresh();
  }

  return (
    <div className="tactical-page">
      <section className="tactical-panel-strong">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tactical-kicker">홈 제어판</p>
            <h2 className="tactical-title">오늘 당직 보드</h2>
            <p className="tactical-copy">오늘 처리해야 할 업무를 전면에 두고, 문서/메모/설정은 같은 오프라인 흐름 안에서 바로 이어집니다.</p>
          </div>
          <div className="text-right">
            <p className="tactical-meta">기준 날짜</p>
            <p className="tactical-meta-value">{selectedDate}</p>
          </div>
        </div>

        <div className="mt-5 tactical-stat-grid">
          <div className="tactical-stat">
            <p className="tactical-stat-label">오늘</p>
            <p className="tactical-stat-value">{data?.todayTasks.length ?? 0}</p>
          </div>
          <div className="tactical-stat">
            <p className="tactical-stat-label">도래</p>
            <p className="tactical-stat-value">{data?.dueTasks.length ?? 0}</p>
          </div>
          <div className="tactical-stat">
            <p className="tactical-stat-label">이슈</p>
            <p className="tactical-stat-value">{data?.carriedIssues.length ?? 0}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => void handleStartScenario('arrival')} className="tactical-button-primary flex items-center justify-center">
            입항
          </button>
          <button type="button" onClick={() => void handleStartScenario('departure')} className="tactical-button-secondary flex items-center justify-center">
            출항
          </button>
          <button type="button" onClick={() => void handleStartScenario('anchoring')} className="tactical-button-ghost flex items-center justify-center">
            투묘
          </button>
          <button type="button" onClick={() => void handleStartScenario('in-port-watch')} className="tactical-button-ghost flex items-center justify-center">
            정박당직
          </button>
        </div>

        <div className="mt-4 tactical-inline-links">
          <a href="/documents" aria-label="문서 빠른 열람 열기" className="tactical-inline-link">
            <strong>문서</strong> 빠른 열람
          </a>
          <a href="/notes" aria-label="인수인계 메모 열기" className="tactical-inline-link">
            <strong>메모</strong> 인수인계
          </a>
          <a href="/settings" aria-label="오프라인 설정 열기" className="tactical-inline-link">
            <strong>설정</strong> 오프라인
          </a>
        </div>

        <div className="mt-5">
          <label className="tactical-meta" htmlFor="home-date-picker">
            기준 날짜
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

      <PageSection title="오늘 업무">
        {data?.todayTasks.length ? data.todayTasks.map((view) => <TaskCard key={view.item.id} view={view} onComplete={handleComplete} onOpen={openDetail} />) : <EmptyState label="해당 날짜에 열려 있는 당직/일간 업무가 없습니다." />}
      </PageSection>

      <PageSection title="도래한 주간/월간 업무">
        {data?.dueTasks.length ? data.dueTasks.map((view) => <TaskCard key={view.item.id} view={view} onComplete={handleComplete} onOpen={openDetail} />) : <EmptyState label="오늘 도래한 주간/월간 업무가 없습니다." />}
      </PageSection>

      <PageSection title="이월 이슈">
        {data?.carriedIssues.length ? data.carriedIssues.map((view) => <TaskCard key={view.item.id} view={view} onComplete={handleComplete} onOpen={openDetail} />) : <EmptyState label="이월된 이슈 업무가 없습니다." />}
      </PageSection>

      <PageSection title="최근 완료 기록">
        {data?.recentCompletions.length ? (
          data.recentCompletions.map(({ log, item }) => (
            <article key={log.id} className="support-panel border-l-2 border-[color:var(--accent-secondary)] text-sm text-[color:var(--text-secondary)]">
              <p className="support-kicker">완료 기록</p>
              <p className="mt-2 text-base font-black uppercase tracking-tight text-[color:var(--text-primary)]">{item?.title ?? log.executionItemId}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-secondary)]">
                완료 {log.recordedAt.replace('T', ' ').slice(0, 16)} UTC
              </p>
            </article>
          ))
        ) : (
          <EmptyState label="첫 완료 기록이 생기면 여기에 표시됩니다." />
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
