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
        <p className="support-kicker">문서</p>
        <h2 className="support-title">매뉴얼 도우미</h2>
        <p className="support-copy">문서번호, 키워드, 발췌문으로 오프라인 상태에서도 즉시 검색할 수 있습니다.</p>
        <div className="mt-4 support-stat-grid">
          <div className="support-stat">
            <p className="support-stat-label">결과</p>
            <p className="support-stat-value">{results.length}</p>
          </div>
          <div className="support-stat">
            <p className="support-stat-label">검색</p>
            <p className="support-stat-value">{query ? '입력중' : '전체'}</p>
          </div>
          <div className="support-stat">
            <p className="support-stat-label">모드</p>
            <p className="support-stat-value">오프라인</p>
          </div>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="문서번호, 키워드, 발췌문 검색"
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
          <p className="tactical-empty">검색 조건에 맞는 문서가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
