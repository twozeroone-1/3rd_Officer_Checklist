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
        <header className="px-5 pt-6">
          <div className="rounded-3xl border border-white/10 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.45)]" style={{ background: 'var(--hero-background)' }}>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Third Officer Assistant</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Offline bridge workflow</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Installable PWA shell with seeded navigation for routine and scenario work.
            </p>
          </div>
        </header>

        <main className="flex-1 px-5 py-5">
          <Outlet />
        </main>

        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md gap-2 overflow-x-auto border-t border-white/10 px-3 py-3 backdrop-blur"
          style={{ background: 'var(--nav-background)' }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex min-h-14 min-w-24 flex-1 items-center justify-center rounded-2xl px-3 text-center text-sm font-medium transition',
                  isActive ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-slate-200',
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
