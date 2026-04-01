import { render, screen, within } from '@testing-library/react';
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

    const navigation = await screen.findByRole('navigation', { name: /주요 탐색/i });
    expect(navigation).toBeInTheDocument();
    expect(within(navigation).getByRole('link', { name: /ctl 홈/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('link', { name: /run 정기/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('link', { name: /mod 상황/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('link', { name: /cal 일정/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('link', { name: /doc 문서/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('link', { name: /log 메모/i })).toBeInTheDocument();
    expect(within(navigation).getByRole('link', { name: /cfg 설정/i })).toBeInTheDocument();

    view.unmount();
  });

  it('surfaces bootstrap failure to the user', async () => {
    vi.spyOn(bootstrapModule, 'bootstrapDatabase').mockRejectedValueOnce(new Error('boom'));

    const view = render(<App />);

    expect(await screen.findByRole('status')).toHaveTextContent(/오프라인 저장소를 초기화할 수 없습니다/i);
  
    view.unmount();
  });
});
