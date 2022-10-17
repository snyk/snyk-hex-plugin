// This file was mostly copied from snyk-python-plugin and its purpose it to support the homebrew package
import * as fs from 'fs';
import * as path from 'upath';
import * as tmp from 'tmp';

export function copyElixirCodeToTempDir(): tmp.DirResult {
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });

  dumpAllFilesInTempDir(tmpDir.name);

  return tmpDir;
}

function dumpAllFilesInTempDir(tempDirName: string) {
  createAssets().forEach((currentReadFilePath) => {
    if (!fs.existsSync(currentReadFilePath)) {
      throw new Error('The file `' + currentReadFilePath + '` is missing');
    }

    const relFilePathToDumpDir =
      getFilePathRelativeToDumpDir(currentReadFilePath);

    const writeFilePath = path.join(tempDirName, relFilePathToDumpDir);

    const contents = fs.readFileSync(currentReadFilePath, 'utf8');
    writeFile(writeFilePath, contents);
  });
}

function createAssets() {
  return [
    path.join(__dirname, '../elixirsrc/mix.exs'),
    path.join(__dirname, '../elixirsrc/mix.lock'),
    path.join(__dirname, '../elixirsrc/lib/mix/tasks/read.mix.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/mix.exs'),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json/encoder.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json/logger.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json/decoder.ex'),
    path.join(
      __dirname,
      '../elixirsrc/lib/json/lib/json/encoder/default_implementations.ex',
    ),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json/encoder/errors.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json/encoder/helpers.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json/parser/number.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json/parser/object.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json/parser/unicode.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json/parser/string.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json/parser/array.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json/parser.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/lib/json.ex'),
    path.join(__dirname, '../elixirsrc/lib/json/.formatter.exs'),
    path.join(__dirname, '../elixirsrc/lib/common.ex'),
    path.join(__dirname, '../elixirsrc/lib/mix_project.ex'),
  ];
}

function getFilePathRelativeToDumpDir(filePath: string) {
  let pathParts = filePath.split('\\elixirsrc\\');

  // Windows
  if (pathParts.length > 1) {
    return pathParts[1];
  }

  // Unix
  pathParts = filePath.split('/elixirsrc/');
  return pathParts[1];
}

function writeFile(writeFilePath: string, contents: string) {
  const dirPath = path.dirname(writeFilePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(writeFilePath, contents);
}
