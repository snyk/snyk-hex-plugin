import * as path from 'path';
import * as fs from 'fs';
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

const MANIFEST_FILE_NAME = 'mix.exs';

export async function scan(options: Options): Promise<PluginResponse> {
  init(options.debug);

  const targetFile = path.parse(
    path.resolve(options.path, options.targetFile || MANIFEST_FILE_NAME),
  );

  if (targetFile.base !== MANIFEST_FILE_NAME) {
    throw new Error("target file must be 'mix.exs'.");
  }

  const [, , mixResult] = await Promise.all([
    verifyHexInstalled(),
    verifyMixInstalled(),
    getMixResult(targetFile.dir),
  ]);

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
  const mixVersion = await subProcess.execute('mix', ['-v']);
  debug(`mix version: `, mixVersion);
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