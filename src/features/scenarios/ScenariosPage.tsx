import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import type { ScenarioSession } from '../../domain/types';
import { db, type ThirdOfficerDatabase } from '../../lib/db/client';
import { resolveNow, type NowValue } from '../tasks/time';
import { formatScenarioTitle, scenarioCatalog } from './scenarioCatalog';
import { loadScenarioSessions, startScenarioSession } from './scenarioSessionData';

type ScenariosPageProps = {
  database?: ThirdOfficerDatabase;
  now?: NowValue;
};

export function ScenariosPage({ database = db, now }: ScenariosPageProps) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ScenarioSession[]>([]);
  const isMounted = useRef(true);

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
    try {
      const nextSessions = await loadScenarioSessions(database);

      if (isMounted.current) {
        setSessions(nextSessions);
      }
    } catch (error) {
      if (!isClosedDatabaseError(error)) {
        throw error;
      }
    }
  }

  useEffect(() => {
    void refresh();
  }, [database]);

  async function handleStart(type: ScenarioSession['scenario']) {
    const session = await startScenarioSession(database, type, resolveNow(now));
    await refresh();
    await navigate(`/scenarios/${session.id}`);
  }

  const activeSessions = sessions.filter((session) => session.status === 'active');
  const completedSessions = sessions.filter((session) => session.status === 'completed');

  return (
    <div className="tactical-page">
      <section className="tactical-panel-strong">
        <p className="tactical-kicker">상황 모드</p>
        <h2 className="tactical-title">가이드 세션</h2>
        <p className="tactical-copy">입항, 출항, 투묘, 정박당직을 세션 단위로 바로 시작할 수 있습니다.</p>
        <div className="mt-4 tactical-stat-grid">
          <div className="tactical-stat">
            <p className="tactical-stat-label">모드</p>
            <p className="tactical-stat-value">{scenarioCatalog.length}</p>
          </div>
          <div className="tactical-stat">
            <p className="tactical-stat-label">진행</p>
            <p className="tactical-stat-value">{activeSessions.length}</p>
          </div>
          <div className="tactical-stat">
            <p className="tactical-stat-label">종료</p>
            <p className="tactical-stat-value">{completedSessions.length}</p>
          </div>
        </div>
      </section>

      <section className="tactical-list-section">
        {scenarioCatalog.map((scenario) => (
          <article key={scenario.type} className="tactical-panel border-l-2 border-[color:var(--accent-primary)]">
            <p className="tactical-kicker">{scenario.title}</p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{scenario.summary}</p>
            <div className="mt-3 grid gap-2 text-[11px] uppercase tracking-[0.16em] text-[color:var(--text-faint)] sm:grid-cols-2">
              <div className="border-l-2 border-[color:var(--surface-highest)] pl-3">구분 {scenario.contexts.join(' / ')}</div>
              <div className="border-l-2 border-[color:var(--surface-highest)] pl-3">근거 {scenario.traceability[0]?.documentId}</div>
            </div>
            <button
              type="button"
              onClick={() => void handleStart(scenario.type)}
              className="tactical-button-primary mt-4 w-full"
              aria-label={`${scenario.title} 세션 시작`}
            >
              세션 시작
            </button>
          </article>
        ))}
      </section>

      <section className="tactical-list-section">
        <h3 className="tactical-list-title">진행 중 세션</h3>
        {activeSessions.length ? (
          activeSessions.map((session) => (
            <article key={session.id} className="tactical-panel border-l-2 border-[color:var(--accent-secondary)]">
              <p className="tactical-kicker">{formatScenarioTitle(session.scenario)}</p>
              <p className="mt-3 text-sm text-[color:var(--text-secondary)]">시작 {session.startedAt.replace('T', ' ').slice(0, 16)} UTC</p>
              <Link
                to={`/scenarios/${session.id}`}
                className="tactical-button-ghost mt-4 flex items-center justify-center"
                aria-label={`${formatScenarioTitle(session.scenario)} 세션 열기`}
              >
                세션 열기
              </Link>
            </article>
          ))
        ) : (
          <p className="tactical-empty">진행 중인 세션이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
