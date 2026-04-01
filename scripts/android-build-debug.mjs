import { spawn } from 'node:child_process';
import { join } from 'node:path';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
      ...options,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

async function ensureToolchain() {
  if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
    throw new Error('Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT before building the APK.');
  }

  await run('bash', ['-lc', 'command -v java >/dev/null']);
}

async function main() {
  await ensureToolchain();
  await run('npm', ['run', 'android:sync']);
  await run('bash', ['-lc', './gradlew assembleDebug'], { cwd: join(process.cwd(), 'android') });
}

await main();
