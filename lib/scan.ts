import * as path from 'path';
import * as fs from 'fs';
import * as tmp from 'tmp';

import { buildDepGraphs, MixJsonResult } from '@snyk/mix-parser';
import * as subProcess from './sub-process';
import { PluginResponse } from './types';
import { debug, init } from './debug';

interface Options {
  debug?: boolean; // true will print out debug messages when using the "--debug" flag
  dev?: boolean; // will include dependencies that are limited to non :prod environments
  projectName?: string; // will be the value of the '--project-name' flag if used.
  path: string;
  targetFile?: string;
}

function createAssets() {
  return [
    path.join(__dirname, '../elixirsrc/mix.exs'),
    path.join(__dirname, '../elixirsrc/mix.lock'),
    path.join(__dirname, '../elixirsrc/lib/mix/tasks/read.mix.ex'),
    path.join(__dirname, '../elixirsrc/lib/common.ex'),
    path.join(__dirname, '../elixirsrc/lib/mix_project.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/.hex'),
    path.join(__dirname, '../elixirsrc/deps/json/mix.exs'),
    path.join(__dirname, '../elixirsrc/deps/json/LICENSE'),
    path.join(__dirname, '../elixirsrc/deps/json/.fetch'),
    path.join(__dirname, '../elixirsrc/deps/json/README.md'),
    path.join(__dirname, '../elixirsrc/deps/json/hex_metadata.config'),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json/encoder.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json/logger.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json/decoder.ex'),
    path.join(
      __dirname,
      '../elixirsrc/deps/json/lib/json/encoder/default_implementations.ex',
    ),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json/encoder/errors.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json/encoder/helpers.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json/parser/number.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json/parser/object.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json/parser/unicode.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json/parser/string.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json/parser/array.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json/parser.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/lib/json.ex'),
    path.join(__dirname, '../elixirsrc/deps/json/.formatter.exs'),
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

function dumpAllFilesInTempDir(tempDirName: string) {
  createAssets().forEach((currentReadFilePath) => {
    if (!fs.existsSync(currentReadFilePath)) {
      throw new Error('The file `' + currentReadFilePath + '` is missing');
    }

    const relFilePathToDumpDir = getFilePathRelativeToDumpDir(
      currentReadFilePath,
    );

    const writeFilePath = path.join(tempDirName, relFilePathToDumpDir);

    const contents = fs.readFileSync(currentReadFilePath, 'utf8');
    writeFile(writeFilePath, contents);
  });
}

const MANIFEST_FILE_NAME = 'mix.exs';

export async function scan(options: Options): Promise<PluginResponse> {
  init(options.debug);

  const tempDirObj = tmp.dirSync({
    unsafeCleanup: true,
  });

  dumpAllFilesInTempDir(tempDirObj.name);

  const targetFile = path.parse(
    path.resolve(options.path, options.targetFile || MANIFEST_FILE_NAME),
  );

  if (targetFile.base !== MANIFEST_FILE_NAME) {
    throw new Error("target file must be 'mix.exs'.");
  }

  await verifyMixInstalled();
  await verifyHexInstalled();

  const mixResult = await getMixResult(targetFile.dir);

  const depGraphMap = buildDepGraphs(mixResult, !!options.dev, true);
  const scanResults = Object.entries(depGraphMap).map(([name, depGraph]) => {
    const isRoot = name === 'root';
    return {
      identity: {
        type: 'hex',
        targetFile: normalizePath(
          path.relative(
            options.path,
            path.resolve(targetFile.dir, isRoot ? '' : name, targetFile.base),
          ),
        ),
      },
      facts: [
        {
          type: 'depGraph',
          data: depGraph,
        },
      ],
      ...(isRoot && options.projectName ? { name: options.projectName } : {}),
    };
  });

  return { scanResults };
}

async function verifyHexInstalled() {
  try {
    const hexInfo = await subProcess.execute('mix', ['hex.info']);
    debug(`hex info: `, hexInfo);
  } catch (err) {
    throw new Error(
      'hex is not installed. please run `mix local.hex` and try again.',
    );
  }
}

async function verifyMixInstalled() {
  try {
    const mixVersion = await subProcess.execute('mix', ['-v']);
    debug(`mix version: `, mixVersion);
  } catch {
    throw new Error(
      'mix is not installed. please make sure Elixir is installed and try again.',
    );
  }
}

async function getMixResult(root: string): Promise<MixJsonResult> {
  const cwd = path.join(__dirname, '../elixirsrc');

  let filePath: string | undefined;
  try {
    const output = await subProcess.execute('mix', ['read.mix', root], { cwd });
    debug(`read.mix output: ${output}`);

    const fileName = output.trim().split('\n').pop();
    debug(`fileName: ${fileName}`);

    filePath = path.resolve(cwd, fileName!);
    const result = (await fs.promises.readFile(filePath, 'utf8')) as string;
    return JSON.parse(result) as MixJsonResult;
  } catch (err) {
    const errorMessage = `Error parsing manifest file on ${root}`;
    debug(errorMessage, err);
    throw new Error(errorMessage);
  } finally {
    if (filePath) {
      await fs.promises
        .unlink(filePath)
        .catch((err) => debug(`can't remove ${filePath}`, err));
    }
  }
}

function normalizePath(filePath: string) {
  const parts = filePath.split(path.sep);
  return parts.join(path.posix.sep);
}
