import { render, screen } from '@testing-library/react';
import * as bootstrapModule from '../lib/db/bootstrap';

import { App } from './App';

describe('App shell', () => {
  beforeEach(() => {
    vi.spyOn(bootstrapModule, 'bootstrapDatabase').mockResolvedValue({} as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the bottom navigation', async () => {
    const view = render(<App />);

    expect(await screen.findByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /routine/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /scenarios/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /calendar/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /documents/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();

    view.unmount();
  });

  it('surfaces bootstrap failure to the user', async () => {
    vi.spyOn(bootstrapModule, 'bootstrapDatabase').mockRejectedValueOnce(new Error('boom'));

    const view = render(<App />);

    expect(await screen.findByRole('status')).toHaveTextContent(/unable to initialize offline storage/i);

    view.unmount();
  });
});
