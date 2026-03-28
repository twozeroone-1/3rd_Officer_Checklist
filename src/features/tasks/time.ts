export type NowValue = string | (() => string) | undefined;

export function resolveNow(now: NowValue) {
  if (typeof now === 'function') {
    return now();
  }

  return now ?? new Date().toISOString();
}
