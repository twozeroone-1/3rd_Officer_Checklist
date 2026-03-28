import type { ManualDocument, ManualExcerpt } from '../../domain/types';

export type ManualSearchResult = {
  document: ManualDocument;
  excerpt: ManualExcerpt;
  documentId: string;
  excerptId: string;
  sectionRef: string;
  matchSource: 'code' | 'title' | 'summary' | 'excerpt';
};

function includesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

export function searchManuals(manuals: ManualDocument[], rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    return manuals.flatMap((document) =>
      document.excerpts.map((excerpt) => ({
        document,
        excerpt,
        documentId: document.id,
        excerptId: excerpt.id,
        sectionRef: excerpt.traceability.sectionRef,
        matchSource: 'summary' as const,
      })),
    );
  }

  return manuals.flatMap((document) => {
    return document.excerpts.flatMap((excerpt) => {
      const values: Array<[ManualSearchResult['matchSource'], string]> = [
        ['code', document.code],
        ['title', document.title],
        ['summary', `${document.summary} ${excerpt.summary}`],
        ['excerpt', excerpt.body],
      ];
      const match = values.find((entry) => includesQuery(entry[1], query));

      if (!match) {
        return [];
      }

      return {
        document,
        excerpt,
        documentId: document.id,
        excerptId: excerpt.id,
        sectionRef: excerpt.traceability.sectionRef,
        matchSource: match[0],
      };
    });
  });
}
