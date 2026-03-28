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
    <section className="support-panel space-y-3">
      <div>
        <p className="support-kicker">Content</p>
        <h3 className="mt-2 text-lg font-black text-[color:var(--text-primary)]">App and manual versions</h3>
      </div>
      <div className="border border-[color:var(--outline-soft)] bg-[color:var(--surface-lowest)] px-4 py-3 text-sm text-[color:var(--text-secondary)]">
        <p className="font-black uppercase tracking-[0.12em] text-[color:var(--text-primary)]">App build</p>
        <p className="mt-1">v{APP_VERSION}</p>
      </div>
      <div className="border border-[color:var(--outline-soft)] bg-[color:var(--surface-lowest)] px-4 py-3 text-sm text-[color:var(--text-secondary)]">
        <p className="font-black uppercase tracking-[0.12em] text-[color:var(--text-primary)]">Manual content pack</p>
        <p className="mt-1">Seed v{manualSeedVersion ?? 'unknown'} • {manualCount} manuals • {templateCount} templates</p>
      </div>
    </section>
  );
}
