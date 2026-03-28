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
    <div className="tactical-page">
      <section className="support-panel">
        <p className="support-kicker">Documents</p>
        <h2 className="support-title">Manual helper</h2>
        <p className="support-copy">Search reference text by document code, keyword, or excerpt content without leaving the offline workflow.</p>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by keyword, code, or excerpt"
          className="tactical-input mt-4"
        />
      </section>

      <section className="tactical-list-section">
        {results.length ? (
          results.map((result) => (
            <article key={`${result.documentId}:${result.excerptId}`} className="support-panel border-l-2 border-[color:var(--accent-secondary)]">
              <p className="support-kicker">{result.document.code} / {result.sectionRef}</p>
              <h3 className="mt-3 text-lg font-black uppercase tracking-tight text-[color:var(--text-primary)]">{result.excerpt.heading}</h3>
              <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{result.excerpt.summary}</p>
              <p className="mt-4 bg-[color:var(--surface-lowest)] px-3 py-3 text-sm leading-7 text-[color:var(--text-secondary)]">{result.excerpt.body}</p>
            </article>
          ))
        ) : (
          <p className="tactical-empty">No manual results match this search yet.</p>
        )}
      </section>
    </div>
  );
}
