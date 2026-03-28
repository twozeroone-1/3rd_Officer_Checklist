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

  return (
    <div className="tactical-page">
      <section className="tactical-panel-strong">
        <p className="tactical-kicker">Scenarios</p>
        <h2 className="tactical-title">Guided bridge modes</h2>
        <p className="tactical-copy">Start a focused session for arrival, departure, anchoring, or in-port watch work.</p>
      </section>

      <section className="tactical-list-section">
        {scenarioCatalog.map((scenario) => (
          <article key={scenario.type} className="tactical-panel border-l-2 border-[color:var(--accent-primary)]">
            <p className="tactical-kicker">{scenario.title}</p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{scenario.summary}</p>
            <button
              type="button"
              onClick={() => void handleStart(scenario.type)}
              className="tactical-button-primary mt-4 w-full"
              aria-label={`Start ${scenario.title} session`}
            >
              Start session
            </button>
          </article>
        ))}
      </section>

      <section className="tactical-list-section">
        <h3 className="tactical-list-title">Active sessions</h3>
        {activeSessions.length ? (
          activeSessions.map((session) => (
            <article key={session.id} className="tactical-panel border-l-2 border-[color:var(--accent-secondary)]">
              <p className="tactical-kicker">{formatScenarioTitle(session.scenario)}</p>
              <p className="mt-3 text-sm text-[color:var(--text-secondary)]">Started {session.startedAt.replace('T', ' ').slice(0, 16)} UTC</p>
              <Link
                to={`/scenarios/${session.id}`}
                className="tactical-button-ghost mt-4 flex items-center justify-center"
                aria-label={`Open ${formatScenarioTitle(session.scenario)} session`}
              >
                Open session
              </Link>
            </article>
          ))
        ) : (
          <p className="tactical-empty">No active sessions yet.</p>
        )}
      </section>
    </div>
  );
}
