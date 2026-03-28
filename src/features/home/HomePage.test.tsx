import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { bootstrapDatabase } from '../../lib/db/bootstrap';
import { ThirdOfficerDatabase } from '../../lib/db/client';
import { HomePage } from './HomePage';

function createTestDatabase(name: string) {
  return new ThirdOfficerDatabase(name);
}

describe('HomePage', () => {
  it('supports one-tap completion and writes a completion log', async () => {
    const database = createTestDatabase('home-page-complete');
    await bootstrapDatabase(database);

    const view = render(
      <HomePage
        database={database}
        now="2026-04-01T08:30:00.000Z"
        initialSelectedDate="2026-04-01T08:30:00.000Z"
      />,
    );

    expect(await screen.findByText(/prepare for watch handover/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /complete prepare for watch handover/i }));

    await screen.findByText(/recent completions/i);

    await waitFor(async () => {
      const item = await database.executionItems.get('routine:watch-handover-prep:2026-04-01');
      expect(item?.status).toBe('done');
      expect(item?.completedAt).toBe('2026-04-01T08:30:00.000Z');
      expect(await database.completionLogs.count()).toBe(1);
    });

    expect(screen.getByText(/prepare for watch handover/i)).toBeInTheDocument();

    view.unmount();
    await database.delete();
  });

  it('updates execution item state from the detail sheet secondary actions', async () => {
    const database = createTestDatabase('home-page-secondary-actions');
    await bootstrapDatabase(database);

    const view = render(
      <HomePage
        database={database}
        now="2026-04-01T08:30:00.000Z"
        initialSelectedDate="2026-04-01T08:30:00.000Z"
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /open details for check navigational equipment readiness/i }));
    fireEvent.change(await screen.findByLabelText(/issue note/i), { target: { value: 'Radar repetition erratic.' } });
    fireEvent.click(screen.getByRole('button', { name: /mark issue/i }));

    await waitFor(async () => {
      const item = await database.executionItems.get('routine:navigational-equipment-checks:2026-04-01');
      expect(item?.status).toBe('blocked');
      expect(item?.note).toBe('Radar repetition erratic.');
    });

    expect(screen.getByText(/carried-over issues/i)).toBeInTheDocument();

    view.unmount();
    await database.delete();
  });

  it('uses the latest clock value when completing after the page stays open', async () => {
    const database = createTestDatabase('home-page-live-clock');
    await bootstrapDatabase(database);
    let now = '2026-04-01T08:30:00.000Z';

    const view = render(
      <HomePage
        database={database}
        now={() => now}
        initialSelectedDate="2026-04-01T08:30:00.000Z"
      />,
    );

    expect(await screen.findByText(/prepare for watch handover/i)).toBeInTheDocument();

    now = '2026-04-01T09:45:00.000Z';
    fireEvent.click(screen.getByRole('button', { name: /complete prepare for watch handover/i }));

    await waitFor(async () => {
      const item = await database.executionItems.get('routine:watch-handover-prep:2026-04-01');
      expect(item?.completedAt).toBe('2026-04-01T09:45:00.000Z');
    });

    view.unmount();
    await database.delete();
  });

  it('starts an anchoring scenario session from the home quick action', async () => {
    const database = createTestDatabase('home-page-start-scenario');
    await bootstrapDatabase(database);

    const view = render(
      <HomePage
        database={database}
        now="2026-04-01T08:30:00.000Z"
        initialSelectedDate="2026-04-01T08:30:00.000Z"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /anchoring/i }));

    await waitFor(async () => {
      const sessions = await database.scenarioSessions.toArray();
      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.scenario).toBe('anchoring');
      expect(sessions[0]?.status).toBe('active');
    });

    view.unmount();
    await database.delete();
  });
});
