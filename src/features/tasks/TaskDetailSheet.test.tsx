import { fireEvent, render, screen } from '@testing-library/react';

import { TaskDetailSheet } from './TaskDetailSheet';
import type { TaskView } from './taskData';

const view: TaskView = {
  item: {
    id: 'routine:watch-handover-prep:2026-04-01',
    templateId: 'watch-handover-prep',
    title: 'Prepare for watch handover',
    status: 'pending',
    scheduledFor: '2026-04-01T00:00:00.000Z',
    contexts: ['sea'],
    conditionTriggers: ['before-watch'],
    responsibility: 'third-officer',
    traceability: [{ documentId: 'fleet-12', excerptId: 'fleet-12-watch-handover', sectionRef: '4.1' }],
  },
  template: {
    id: 'watch-handover-prep',
    title: 'Prepare for watch handover',
    category: 'routine',
    summary: 'Review standing orders, traffic picture, weather, and defects before taking over the bridge watch.',
    frequency: 'watch',
    contexts: ['sea'],
    conditionTriggers: ['before-watch'],
    responsibility: 'third-officer',
    status: 'active',
    traceability: [{ documentId: 'fleet-12', excerptId: 'fleet-12-watch-handover', sectionRef: '4.1' }],
  },
  frequency: 'watch',
};

describe('TaskDetailSheet', () => {
  it('does not call onReschedule when datetime-local is cleared', () => {
    const onReschedule = vi.fn();

    render(
      <TaskDetailSheet
        view={view}
        detail={null}
        onClose={vi.fn()}
        onComplete={vi.fn()}
        onBlock={vi.fn()}
        onSkip={vi.fn()}
        onReschedule={onReschedule}
      />,
    );

    fireEvent.change(screen.getByLabelText(/change date\/time/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save date\/time/i }));

    expect(onReschedule).not.toHaveBeenCalled();
  });
});
