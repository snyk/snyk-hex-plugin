import * as childProcess from 'child_process';
import { debug } from './debug';
import { escapeAll, quoteAll } from 'shescape/stateless';
import * as os from 'node:os';

export function execute(
  command: string,
  args: string[],
  options?: { cwd?: string },
): Promise<string> {
  debug(`running "${command} ${args.join(' ')}"`);

  const spawnOptions: childProcess.SpawnOptions = { shell: false };
  if (options && options.cwd) {
    spawnOptions.cwd = options.cwd;
  }

  if (args) {
    // Best practices, also security-wise, is to not invoke processes in a shell, but as a stand-alone command.
    // However, on Windows, we need to invoke the command in a shell, due to internal NodeJS problems with this approach
    // see: https://nodejs.org/docs/latest-v24.x/api/child_process.html#spawning-bat-and-cmd-files-on-windows
    const isWinLocal = /^win/.test(os.platform());
    if (isWinLocal) {
      spawnOptions.shell = true;
      // Further, we distinguish between quoting and escaping arguments since quoteAll does not support quoting without
      // supplying a shell, but escapeAll does.
      // See this (very long) discussion for more details: https://github.com/ericcornelissen/shescape/issues/2009
      args = quoteAll(args, { ...spawnOptions, flagProtection: false });
    } else {
      args = escapeAll(args, { ...spawnOptions, flagProtection: false });
    }
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

    // Handle spawn errors (e.g., ENOENT when command doesn't exist)
    proc.on('error', (error) => {
      stderr = error.message;
      reject({ stdout, stderr });
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
