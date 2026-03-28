import { NavLink, Outlet, RouterProvider } from 'react-router-dom';

import { router } from './router';
import { AppProviders } from './providers';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/routine', label: 'Routine' },
  { to: '/scenarios', label: 'Scenarios' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/documents', label: 'Documents' },
  { to: '/notes', label: 'Notes' },
  { to: '/settings', label: 'Settings' },
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
                  Third Officer Assistant
                </p>
                <h1 className="tactical-title">NAV COMMAND</h1>
              </div>
              <div className="text-right">
                <p className="tactical-meta">Platform</p>
                <p className="tactical-meta-value">Android PWA</p>
              </div>
            </div>
            <p className="tactical-copy">Offline routine control, scenario execution, documents, notes, and settings stay available onboard.</p>
          </div>
        </header>

        <main className="flex-1 px-4 py-4">
          <Outlet />
        </main>

        <nav
          aria-label="Primary"
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
              {item.label}
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
