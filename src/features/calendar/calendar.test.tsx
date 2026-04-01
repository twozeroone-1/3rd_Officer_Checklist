import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { bootstrapDatabase } from '../../lib/db/bootstrap';
import { ThirdOfficerDatabase } from '../../lib/db/client';
import { CalendarPage } from './CalendarPage';

function createTestDatabase(name: string) {
  return new ThirdOfficerDatabase(name);
}

describe('CalendarPage', () => {
  it('regenerates routine, carry-over, and active scenario work for the selected date', async () => {
    const database = createTestDatabase('calendar-page-workload');
    await bootstrapDatabase(database);
    await database.executionItems.put({
      id: 'routine:navigational-equipment-checks:2026-03-31',
      templateId: 'navigational-equipment-checks',
      title: 'Check navigational equipment readiness',
      status: 'blocked',
      scheduledFor: '2026-03-31T08:00:00.000Z',
      contexts: ['sea'],
      conditionTriggers: ['during-watch'],
      responsibility: 'third-officer',
      traceability: [{ documentId: 'fleet-12', excerptId: 'fleet-12-nav-equipment-check', sectionRef: '4.4' }],
      note: 'Awaiting radar tech review.',
    });
    await database.scenarioSessions.put({
      id: 'session-anchor',
      scenario: 'anchoring',
      status: 'active',
      startedAt: '2026-04-01T01:15:00.000Z',
      contexts: ['anchoring'],
      executionItemIds: [],
      responsibility: 'bridge-team',
      traceability: [{ documentId: 'fleet-i21', excerptId: 'fleet-i21-anchor-prep', sectionRef: '2.2' }],
    });

    const view = render(<CalendarPage database={database} now="2026-04-01T03:20:00.000Z" />);
    const carryOverSection = (await screen.findByRole('heading', { name: /이월 업무/i })).closest('section')!;
    const scenarioSection = (await screen.findByRole('heading', { name: /진행 중 상황 업무/i })).closest('section')!;

    expect(await screen.findByRole('heading', { name: /날짜별 업무/i })).toBeInTheDocument();
    expect(await screen.findByText(/run anchoring preparation/i)).toBeInTheDocument();
    expect((await within(scenarioSection).findAllByText(/record hourly anchor position check/i)).length).toBeGreaterThan(0);
    expect(await within(carryOverSection).findByText(/check navigational equipment readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/실제 utc 시간이 기록됩니다/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/업무 기준 날짜/i), { target: { value: '2026-04-02' } });

    await waitFor(() => {
      expect(within(scenarioSection).queryAllByText(/record hourly anchor position check/i)).toHaveLength(0);
    });

    view.unmount();
    await database.delete();
  });

  it('shows overdue open work in the carry-over section even when it is not scheduled for the selected date', async () => {
    const database = createTestDatabase('calendar-page-overdue-carry-over');
    await bootstrapDatabase(database);
    await database.executionItems.put({
      id: 'routine:watch-handover-prep:2026-03-31',
      templateId: 'watch-handover-prep',
      title: 'Prepare for watch handover',
      status: 'blocked',
      scheduledFor: '2026-03-31T18:00:00.000Z',
      contexts: ['sea'],
      conditionTriggers: ['before-watch'],
      responsibility: 'third-officer',
      traceability: [{ documentId: 'fleet-12', excerptId: 'fleet-12-watch-handover', sectionRef: '4.1' }],
      note: 'Still pending from yesterday.',
    });

    const view = render(<CalendarPage database={database} now="2026-04-01T03:20:00.000Z" />);
    const carryOverSection = (await screen.findByRole('heading', { name: /이월 업무/i })).closest('section')!;

    expect(await within(carryOverSection).findByText(/prepare for watch handover/i)).toBeInTheDocument();
    expect(await within(carryOverSection).findByText(/still pending from yesterday/i)).toBeInTheDocument();

    view.unmount();
    await database.delete();
  });
});
