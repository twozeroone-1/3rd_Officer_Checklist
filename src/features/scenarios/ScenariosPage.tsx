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
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.28)]">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Scenarios</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Guided bridge modes</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Start a focused session for arrival, departure, anchoring, or in-port watch work.</p>
      </section>

      <section className="space-y-3">
        {scenarioCatalog.map((scenario) => (
          <article key={scenario.type} className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_12px_36px_rgba(2,6,23,0.24)]">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">{scenario.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{scenario.summary}</p>
            <button
              type="button"
              onClick={() => void handleStart(scenario.type)}
              className="mt-4 min-h-12 w-full rounded-2xl bg-cyan-300 px-3 text-sm font-semibold text-slate-950"
              aria-label={`Start ${scenario.title} session`}
            >
              Start session
            </button>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Active sessions</h3>
        {activeSessions.length ? (
          activeSessions.map((session) => (
            <article key={session.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">{formatScenarioTitle(session.scenario)}</p>
              <p className="mt-2 text-sm text-slate-300">Started {session.startedAt.replace('T', ' ').slice(0, 16)} UTC</p>
              <Link
                to={`/scenarios/${session.id}`}
                className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-white/10 px-3 text-sm font-medium text-white"
                aria-label={`Open ${formatScenarioTitle(session.scenario)} session`}
              >
                Open session
              </Link>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">No active sessions yet.</p>
        )}
      </section>
    </div>
  );
}
