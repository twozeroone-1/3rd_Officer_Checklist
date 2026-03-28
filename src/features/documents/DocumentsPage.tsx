import { useEffect, useState } from 'react';

import { db, type ThirdOfficerDatabase } from '../../lib/db/client';
import { loadManualSearch } from '../tasks/taskData';

type DocumentsPageProps = {
  database?: ThirdOfficerDatabase;
};

export function DocumentsPage({ database = db }: DocumentsPageProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Awaited<ReturnType<typeof loadManualSearch>>>([]);

  useEffect(() => {
    void loadManualSearch(database, query).then(setResults);
  }, [database, query]);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.28)]">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Documents</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Manual helper</h2>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by keyword, code, or excerpt"
          className="mt-4 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 text-sm text-white"
        />
      </section>

      <section className="space-y-3">
        {results.map((result) => (
          <article key={`${result.documentId}:${result.excerptId}`} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">{result.document.code} - {result.sectionRef}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{result.excerpt.heading}</h3>
            <p className="mt-2 text-sm text-slate-300">{result.excerpt.summary}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{result.excerpt.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
