import { PropsWithChildren, useEffect, useState } from 'react';

import { bootstrapDatabase } from '../lib/db/bootstrap';
import { db } from '../lib/db/client';
import { initializeTheme, syncThemeFromDatabase } from '../lib/theme/themeStore';

export function AppProviders({ children }: PropsWithChildren) {
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(typeof indexedDB === 'undefined');

  useEffect(() => {
    initializeTheme();

    if (typeof indexedDB !== 'undefined') {
      void bootstrapDatabase()
        .then(() => syncThemeFromDatabase(db))
        .catch((error: unknown) => {
          setBootstrapError(error instanceof Error ? error.message : 'Unknown storage initialization error.');
        })
        .finally(() => {
          setIsReady(true);
        });
    }
  }, []);

  return (
    <>
      {bootstrapError ? (
        <div
          role="status"
          className="mx-5 mt-4 rounded-2xl border border-amber-400/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
        >
          오프라인 저장소를 초기화할 수 없습니다. {bootstrapError}
        </div>
      ) : null}
      {isReady ? children : null}
    </>
  );
}
