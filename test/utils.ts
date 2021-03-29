import * as path from 'path';

export function cleanTargetFile(targetFile: string) {
  // This replace will replace windows "\\" with "/" to match snapshot
  return targetFile.replace(/\\/g, path.posix.sep);
}
