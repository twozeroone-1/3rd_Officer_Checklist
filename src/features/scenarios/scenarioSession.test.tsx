import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { bootstrapDatabase } from '../../lib/db/bootstrap';
import { ThirdOfficerDatabase } from '../../lib/db/client';
import { ScenarioSessionPage } from './ScenarioSessionPage';
import { ScenariosPage } from './ScenariosPage';

function createTestDatabase(name: string) {
  return new ThirdOfficerDatabase(name);
}

function renderScenarioApp(database: ThirdOfficerDatabase, now = '2026-04-01T03:20:00.000Z') {
  const router = createMemoryRouter(
    [
      {
        path: '/scenarios',
        element: <ScenariosPage database={database} now={now} />,
      },
      {
        path: '/scenarios/:sessionId',
        element: <ScenarioSessionPage database={database} now={now} />,
      },
      {
        path: '/calendar',
        element: <div>Calendar</div>,
      },
    ],
    { initialEntries: ['/scenarios'] },
  );

  return render(<RouterProvider router={router} />);
}

describe('scenario flows', () => {
  it('starts an anchoring session, persists it, and shows generated session work including hourly anchor checks', async () => {
    const database = createTestDatabase('scenario-page-anchoring');
    await bootstrapDatabase(database);

    const view = renderScenarioApp(database);

    fireEvent.click(await screen.findByRole('button', { name: /start anchoring session/i }));

    expect(await screen.findByRole('heading', { name: /anchoring session/i })).toBeInTheDocument();
    expect(await screen.findByText(/run anchoring preparation/i)).toBeInTheDocument();
    expect(await screen.findByText(/record hourly anchor position check/i)).toBeInTheDocument();

    await waitFor(async () => {
      const sessions = await database.scenarioSessions.toArray();

      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toMatchObject({
        scenario: 'anchoring',
        status: 'active',
        startedAt: '2026-04-01T03:20:00.000Z',
      });
    });

    view.unmount();
    await database.delete();
  });

  it('shows active sessions on the scenarios page and can complete a session', async () => {
    const database = createTestDatabase('scenario-page-active-sessions');
    await bootstrapDatabase(database);
    await database.scenarioSessions.put({
      id: 'session-arrival',
      scenario: 'arrival',
      status: 'active',
      startedAt: '2026-04-01T08:00:00.000Z',
      contexts: ['arrival'],
      executionItemIds: [],
      responsibility: 'bridge-team',
      traceability: [{ documentId: 'fleet-15', excerptId: 'fleet-15-arrival-brief', sectionRef: '2.5' }],
    });

    const router = createMemoryRouter(
      [
        {
          path: '/scenarios',
          element: <ScenariosPage database={database} now="2026-04-01T09:30:00.000Z" />,
        },
        {
          path: '/scenarios/:sessionId',
          element: <ScenarioSessionPage database={database} now="2026-04-01T09:30:00.000Z" />,
        },
      ],
      { initialEntries: ['/scenarios'] },
    );

    const view = render(<RouterProvider router={router} />);

    expect(await screen.findByText(/active sessions/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /open arrival session/i }));
    fireEvent.click(await screen.findByRole('button', { name: /complete and close session/i }));

    await waitFor(async () => {
      const session = await database.scenarioSessions.get('session-arrival');
      expect(session).toMatchObject({
        status: 'completed',
        endedAt: '2026-04-01T09:30:00.000Z',
      });
    });

    view.unmount();
    await database.delete();
  });
});
