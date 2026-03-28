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
  dark: 'Dark bridge',
  night: 'True-black night',
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
        <p className="support-kicker">Settings</p>
        <h2 className="support-title">Device and offline controls</h2>
        <p className="support-copy">Keep this page calmer than the operational screens while still matching the tactical palette and typography.</p>
      </section>

      <section className="support-panel space-y-3">
        <div>
          <p className="support-kicker">Theme</p>
          <h3 className="mt-2 text-lg font-black text-[color:var(--text-primary)]">Display mode</h3>
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
        <p className="support-kicker">Reminders</p>
        <h3 className="mt-2 text-lg font-black text-[color:var(--text-primary)]">{reminderPolicy.title}</h3>
        <p className="mt-3 leading-6">{reminderPolicy.detail}</p>
      </section>

      <ContentVersionSection database={database} />
      <BackupRestoreSection database={database} />
    </div>
  );
}
