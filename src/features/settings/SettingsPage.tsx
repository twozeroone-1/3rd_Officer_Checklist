import { useEffect, useState } from 'react';

import { db, type ThirdOfficerDatabase } from '../../lib/db/client';
import { getReminderPolicy } from '../../lib/notifications/reminderPolicy';
import { getStoredTheme, saveThemePreference, themeChoices, type ThemeChoice } from '../../lib/theme/themeStore';
import { BackupRestoreSection } from './BackupRestoreSection';
import { ContentVersionSection } from './ContentVersionSection';

type SettingsPageProps = {
  database?: ThirdOfficerDatabase;
};

const themeLabels: Record<ThemeChoice, string> = {
  dark: '브릿지 다크',
  night: '트루블랙 야간',
};

export function SettingsPage({ database = db }: SettingsPageProps) {
  const [theme, setTheme] = useState<ThemeChoice>('dark');
  const reminderPolicy = getReminderPolicy();

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  async function handleThemeChange(nextTheme: ThemeChoice) {
    setTheme(nextTheme);
    await saveThemePreference(database, nextTheme, new Date().toISOString());
  }

  return (
    <div className="tactical-page">
      <section className="support-panel">
        <p className="support-kicker">설정</p>
        <h2 className="support-title">기기 및 오프라인 설정</h2>
        <p className="support-copy">운영 화면보다 차분하게 유지하되, 전체 앱과 같은 전술형 시각 언어를 공유합니다.</p>
        <div className="mt-4 support-stat-grid">
          <div className="support-stat">
            <p className="support-stat-label">테마</p>
            <p className="support-stat-value">{themeLabels[theme]}</p>
          </div>
          <div className="support-stat">
            <p className="support-stat-label">백업</p>
            <p className="support-stat-value">준비됨</p>
          </div>
          <div className="support-stat">
            <p className="support-stat-label">모드</p>
            <p className="support-stat-value">오프라인</p>
          </div>
        </div>
      </section>

      <section className="support-panel space-y-3">
        <div>
          <p className="support-kicker">테마</p>
          <h3 className="mt-2 text-lg font-black text-[color:var(--text-primary)]">화면 모드</h3>
        </div>
        <div className="grid gap-3">
          {themeChoices.map((choice) => (
            <label key={choice} className="flex items-center gap-3 border border-[color:var(--outline-soft)] bg-[color:var(--surface-lowest)] px-4 py-3 text-sm text-[color:var(--text-primary)]">
              <input type="radio" name="theme-choice" checked={theme === choice} onChange={() => void handleThemeChange(choice)} />
              <span>{themeLabels[choice]}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="support-panel text-sm text-[color:var(--text-secondary)]">
        <p className="support-kicker">알림</p>
        <h3 className="mt-2 text-lg font-black text-[color:var(--text-primary)]">{reminderPolicy.title}</h3>
        <p className="mt-3 leading-6">{reminderPolicy.detail}</p>
      </section>

      <ContentVersionSection database={database} />
      <BackupRestoreSection database={database} />
    </div>
  );
}
