import { useEffect, useState } from 'react';

import { APP_VERSION } from '../../domain/constants';
import { db, type ThirdOfficerDatabase } from '../../lib/db/client';

type ContentVersionSectionProps = {
  database?: ThirdOfficerDatabase;
};

export function ContentVersionSection({ database = db }: ContentVersionSectionProps) {
  const [manualCount, setManualCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);
  const [manualSeedVersion, setManualSeedVersion] = useState<number | null>(null);

  useEffect(() => {
    void Promise.all([
      database.manuals.count(),
      database.taskTemplates.count(),
      database.seedState.get('manuals'),
    ]).then(([nextManualCount, nextTemplateCount, seedState]) => {
      setManualCount(nextManualCount);
      setTemplateCount(nextTemplateCount);
      setManualSeedVersion(seedState?.version ?? null);
    });
  }, [database]);

  return (
    <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Content</p>
        <h3 className="mt-2 text-lg font-semibold text-white">App and manual versions</h3>
      </div>
      <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
        <p className="font-medium text-white">App build</p>
        <p className="mt-1">v{APP_VERSION}</p>
      </div>
      <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
        <p className="font-medium text-white">Manual content pack</p>
        <p className="mt-1">Seed v{manualSeedVersion ?? 'unknown'} • {manualCount} manuals • {templateCount} templates</p>
      </div>
    </section>
  );
}
