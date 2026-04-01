import { NavLink, Outlet, RouterProvider } from 'react-router-dom';

import { router } from './router';
import { AppProviders } from './providers';

const navItems = [
  { to: '/', code: 'CTL', label: '홈' },
  { to: '/routine', code: 'RUN', label: '정기' },
  { to: '/scenarios', code: 'MOD', label: '상황' },
  { to: '/calendar', code: 'CAL', label: '일정' },
  { to: '/documents', code: 'DOC', label: '문서' },
  { to: '/notes', code: 'LOG', label: '메모' },
  { to: '/settings', code: 'CFG', label: '설정' },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas text-foam">
      <div className="mx-auto flex min-h-screen max-w-md flex-col pb-28" style={{ background: 'var(--app-shell-background)' }}>
        <header className="border-b border-[color:var(--outline-soft)] px-4 py-5">
          <div className="support-panel" style={{ background: 'var(--hero-background)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="tactical-kicker" style={{ color: 'var(--accent-primary)' }}>
                  3등 항해사 체크리스트
                </p>
                <h1 className="tactical-title">항해 업무</h1>
              </div>
              <div className="text-right">
                <p className="tactical-meta">플랫폼</p>
                <p className="tactical-meta-value">Android PWA</p>
              </div>
            </div>
            <p className="tactical-copy">오프라인 상태에서도 정기 업무, 상황 모드, 문서, 메모, 설정을 선내에서 바로 사용할 수 있습니다.</p>
          </div>
        </header>

        <main className="flex-1 px-4 py-4">
          <Outlet />
        </main>

        <nav
          aria-label="주요 탐색"
          className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md gap-2 overflow-x-auto border-t-2 border-[color:var(--surface-highest)] px-2 py-2 backdrop-blur"
          style={{ background: 'var(--nav-background)' }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex min-h-14 min-w-24 flex-1 items-center justify-center border px-3 text-center text-[11px] font-black uppercase tracking-[0.12em] transition',
                  isActive
                    ? 'border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)] text-[#261a00]'
                    : 'border-[color:var(--outline-soft)] bg-[color:var(--surface-low)] text-[color:var(--text-secondary)]',
                ].join(' ')
              }
            >
              <span className="flex flex-col items-center gap-1">
                <span className="text-[9px] tracking-[0.22em] opacity-80">{item.code}</span>
                <span>{item.label}</span>
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
