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

const groupLabels: Record<TaskView['frequency'], string> = {
  watch: '당직',
  daily: '일간',
  weekly: '주간',
  monthly: '월간',
  conditional: '조건부',
  scenario: '상황',
};

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
    <div className="tactical-page">
      <section className="tactical-panel-strong">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tactical-kicker">정기 업무</p>
            <h2 className="tactical-title">주기별 점검</h2>
            <p className="tactical-copy">일간, 주간, 월간, 조건부 업무를 주기별로 묶어 빠르게 처리할 수 있습니다.</p>
          </div>
          <div className="text-right">
            <p className="tactical-meta">미완료 항목</p>
            <p className="tactical-meta-value">{views.length}</p>
          </div>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="tactical-input mt-5"
        />
      </section>

      {groups.map((group) => {
        const entries = views.filter((view) => view.frequency === group);
        return (
          <section key={group} className="tactical-list-section">
            <div className="flex items-center justify-between">
              <h3 className="tactical-list-title">{groupLabels[group]}</h3>
              <span className="tactical-meta-value">{entries.length}</span>
            </div>
            {entries.length ? (
              entries.map((view) => <TaskCard key={view.item.id} view={view} onComplete={handleComplete} onOpen={openDetail} />)
            ) : (
              <p className="tactical-empty">해당 날짜에 {groupLabels[group]} 업무가 없습니다.</p>
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
