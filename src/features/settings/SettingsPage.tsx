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
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.28)]">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Settings</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Device and offline controls</h2>
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Theme</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Display mode</h3>
        </div>
        <div className="grid gap-3">
          {themeChoices.map((choice) => (
            <label key={choice} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200">
              <input type="radio" name="theme-choice" checked={theme === choice} onChange={() => void handleThemeChange(choice)} />
              <span>{themeLabels[choice]}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Reminders</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{reminderPolicy.title}</h3>
        <p className="mt-2 leading-6">{reminderPolicy.detail}</p>
      </section>

      <ContentVersionSection database={database} />
      <BackupRestoreSection database={database} />
    </div>
  );
}
