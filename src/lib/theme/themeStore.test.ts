import { applyTheme, getStoredTheme, saveAndApplyTheme, THEME_STORAGE_KEY } from './themeStore';

describe('themeStore', () => {
  it('falls back to dark when no stored theme exists', () => {
    localStorage.removeItem(THEME_STORAGE_KEY);

    expect(getStoredTheme()).toBe('dark');
  });

  it('saves and applies the chosen theme', () => {
    saveAndApplyTheme('night');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('night');
    expect(document.documentElement.dataset.theme).toBe('night');
    expect(document.documentElement.style.colorScheme).toBe('dark');

    applyTheme('dark');
  });
});
