export type ReminderPolicy = {
  mode: 'in-app-only' | 'browser-supported';
  title: string;
  detail: string;
};

export function getReminderPolicy(environment: typeof globalThis = globalThis): ReminderPolicy {
  if ('Notification' in environment) {
    return {
      mode: 'browser-supported',
      title: 'Browser reminders available',
      detail: 'This build keeps workload regeneration in-app and can later layer browser notifications on top.',
    };
  }

  return {
    mode: 'in-app-only',
    title: 'In-app reminders only',
    detail: 'Android Chrome can still rely on regenerated workload views even when browser notifications are unavailable.',
  };
}
