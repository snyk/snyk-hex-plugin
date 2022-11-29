import * as os from 'os';

export function getMixCmd(shell = false): string {
  if (/^win/.test(os.platform()) && !shell) {
    return 'mix.bat';
  }
  return 'mix';
}
