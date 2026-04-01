import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import capacitorConfig from '../../capacitor.config';

describe('Android packaging configuration', () => {
  it('defines the Capacitor app shell for Android packaging', () => {
    expect(capacitorConfig.appId).toBe('com.twozeroone.thirdofficer');
    expect(capacitorConfig.appName).toBe('3rd Officer Checklist');
    expect(capacitorConfig.webDir).toBe('dist');
  });

  it('exposes npm scripts for syncing and building Android', () => {
    const packageJsonPath = resolve(import.meta.dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.['android:sync']).toBeDefined();
    expect(packageJson.scripts?.['android:build:debug']).toBeDefined();
  });
});
