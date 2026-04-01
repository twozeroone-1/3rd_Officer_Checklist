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
        <p className="support-kicker">콘텐츠</p>
        <h3 className="mt-2 text-lg font-black text-[color:var(--text-primary)]">앱 및 문서 버전</h3>
      </div>
      <div className="border border-[color:var(--outline-soft)] bg-[color:var(--surface-lowest)] px-4 py-3 text-sm text-[color:var(--text-secondary)]">
        <p className="font-black uppercase tracking-[0.12em] text-[color:var(--text-primary)]">앱 빌드</p>
        <p className="mt-1">v{APP_VERSION}</p>
      </div>
      <div className="border border-[color:var(--outline-soft)] bg-[color:var(--surface-lowest)] px-4 py-3 text-sm text-[color:var(--text-secondary)]">
        <p className="font-black uppercase tracking-[0.12em] text-[color:var(--text-primary)]">문서 콘텐츠 팩</p>
        <p className="mt-1">시드 v{manualSeedVersion ?? 'unknown'} • 매뉴얼 {manualCount}건 • 템플릿 {templateCount}건</p>
      </div>
    </section>
  );
}
