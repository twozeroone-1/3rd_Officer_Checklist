import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

async function hasExecutable(command) {
  const { spawn } = await import('node:child_process');

  return new Promise((resolve) => {
    const child = spawn('bash', ['-lc', `command -v ${command}`], { stdio: 'ignore' });
    child.on('exit', (code) => resolve(code === 0));
  });
}

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
  const diagnostics = {
    java: await hasExecutable('java'),
    adb: await hasExecutable('adb'),
    sdkmanager: await hasExecutable('sdkmanager'),
    androidSdkRoot: sdkRoot || null,
    gradlew: await fileExists(join(process.cwd(), 'android', 'gradlew')),
  };

  console.log(JSON.stringify(diagnostics, null, 2));

  if (!diagnostics.java || !diagnostics.androidSdkRoot || !diagnostics.sdkmanager) {
    process.exitCode = 1;
  }
}

await main();
