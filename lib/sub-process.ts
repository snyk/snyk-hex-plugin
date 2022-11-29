import * as childProcess from 'child_process';
import { debug } from './debug';

export function execute(
  command: string,
  args: string[],
  options?: { cwd?: string; shell?: boolean },
): Promise<string> {
  debug(`running "${command} ${args.join(' ')}"`);

  const spawnOptions: childProcess.SpawnOptions = {};
  if (options?.shell) {
    spawnOptions.shell = true;
  }
  if (options?.cwd) {
    spawnOptions.cwd = options.cwd;
  }

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const proc = childProcess.spawn(command, args, spawnOptions);
    proc.stdout?.on('data', (data: Buffer) => {
      stdout = stdout + data;
    });
    proc.stderr?.on('data', (data: Buffer) => {
      stderr = stderr + data;
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        debug(
          `Error running "${command} ${args.join(' ')}", exit code: ${code}`,
        );
        return reject(stdout || stderr);
      }
      debug(`Sub process stderr:`, stderr);
      resolve(stdout || stderr);
    });
  });
}
