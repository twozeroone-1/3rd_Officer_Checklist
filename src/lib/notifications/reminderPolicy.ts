export type ReminderPolicy = {
  mode: 'in-app-only' | 'browser-supported';
  title: string;
  detail: string;
};

export function getReminderPolicy(environment: typeof globalThis = globalThis): ReminderPolicy {
  if ('Notification' in environment) {
    return {
      mode: 'browser-supported',
      title: '브라우저 알림 사용 가능',
      detail: '현재 빌드는 앱 안에서 업무를 다시 생성해 보여주며, 이후 브라우저 알림을 추가로 얹을 수 있습니다.',
    };
  }

  return {
    mode: 'in-app-only',
    title: '앱 내 알림만 사용',
    detail: '브라우저 알림이 없어도 Android Chrome에서는 재생성된 업무 화면으로 당일 할 일을 계속 확인할 수 있습니다.',
  };
}
