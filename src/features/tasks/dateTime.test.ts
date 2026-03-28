import { formatUtcIsoForDateTimeLocal, parseDateTimeLocalToUtcIso } from './dateTime';

describe('dateTime helpers', () => {
  it('round-trips a datetime-local value through UTC using an explicit timezone offset', () => {
    const localValue = '2026-04-02T03:45';
    const utcValue = parseDateTimeLocalToUtcIso(localValue, -120);

    expect(utcValue).toBe('2026-04-02T01:45:00.000Z');
    expect(formatUtcIsoForDateTimeLocal(utcValue, -120)).toBe(localValue);
  });
});
