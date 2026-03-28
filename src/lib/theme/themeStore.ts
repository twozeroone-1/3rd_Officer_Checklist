import type { AppSetting } from '../../domain/types';
import type { ThirdOfficerDatabase } from '../db/client';

export const THEME_STORAGE_KEY = 'third-officer-theme';

export const themeChoices = ['dark', 'night'] as const;

export type ThemeChoice = (typeof themeChoices)[number];

function isThemeChoice(value: string): value is ThemeChoice {
  return themeChoices.includes(value as ThemeChoice);
}

export function getStoredTheme(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage) {
  const value = storage?.getItem(THEME_STORAGE_KEY) ?? '';

  return isThemeChoice(value) ? value : 'dark';
}

export function applyTheme(theme: ThemeChoice, root: Pick<HTMLElement, 'dataset' | 'style'> = document.documentElement) {
  root.dataset.theme = theme;
  root.style.colorScheme = 'dark';
}

export function setStoredTheme(theme: ThemeChoice, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage) {
  storage?.setItem(THEME_STORAGE_KEY, theme);
}

export function initializeTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

export function saveAndApplyTheme(theme: ThemeChoice) {
  setStoredTheme(theme);
  applyTheme(theme);
}

export function createThemeSetting(theme: ThemeChoice, updatedAt: string): AppSetting {
  return {
    key: 'theme',
    value: theme,
    updatedAt,
  };
}

export async function saveThemePreference(database: ThirdOfficerDatabase, theme: ThemeChoice, updatedAt: string) {
  await database.appSettings.put(createThemeSetting(theme, updatedAt));
  saveAndApplyTheme(theme);
}

export async function syncThemeFromDatabase(database: ThirdOfficerDatabase) {
  const storedTheme = await database.appSettings.get('theme');

  if (!storedTheme) {
    return getStoredTheme();
  }

  saveAndApplyTheme(storedTheme.value);
  return storedTheme.value;
}
