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
    <section className="tactical-list-section">
      <h3 className="tactical-list-title">{props.title}</h3>
      {props.views.length ? (
        props.views.map((view) => <TaskCard key={view.item.id} view={view} onComplete={props.onComplete} onOpen={props.onOpen} />)
      ) : (
        <p className="tactical-empty">{props.empty}</p>
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
    <div className="tactical-page">
      <section className="tactical-panel-strong">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tactical-kicker">일정</p>
            <h2 className="tactical-title">날짜별 업무</h2>
            <p className="tactical-copy">업무 기준 날짜를 고르고, 실제 완료 시각은 별도로 기록합니다.</p>
          </div>
          <div className="text-right">
            <p className="tactical-meta">선택일</p>
            <p className="tactical-meta-value">{selectedDate}</p>
          </div>
        </div>
        <div className="mt-4 tactical-stat-grid">
          <div className="tactical-stat">
            <p className="tactical-stat-label">정기</p>
            <p className="tactical-stat-value">{data?.routineViews.length ?? 0}</p>
          </div>
          <div className="tactical-stat">
            <p className="tactical-stat-label">상황</p>
            <p className="tactical-stat-value">{data?.scenarioViews.length ?? 0}</p>
          </div>
          <div className="tactical-stat">
            <p className="tactical-stat-label">이월</p>
            <p className="tactical-stat-value">{data?.carryOverViews.length ?? 0}</p>
          </div>
        </div>
        <label className="tactical-meta mt-5 block" htmlFor="calendar-date-picker">
          업무 기준 날짜
        </label>
        <input
          id="calendar-date-picker"
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="tactical-input mt-3"
        />
        <p className="tactical-strip mt-4">
          기준 날짜는 업무 생성에만 사용되고, 완료/이슈/재일정 처리 시에는 실제 UTC 시간이 기록됩니다.
        </p>
      </section>

      <WorkloadSection
        title="선택 날짜 정기 업무"
        empty="해당 날짜에 정기 업무가 없습니다."
        views={data?.routineViews ?? []}
        onComplete={handleComplete}
        onOpen={openDetail}
      />
      <WorkloadSection
        title="진행 중 상황 업무"
        empty="해당 날짜에 연결된 상황 업무가 없습니다."
        views={data?.scenarioViews ?? []}
        onComplete={handleComplete}
        onOpen={openDetail}
      />
      <WorkloadSection
        title="이월 업무"
        empty="이 날짜로 넘어오는 이월 업무가 없습니다."
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
