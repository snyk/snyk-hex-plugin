import * as path from 'upath';
import * as fs from 'fs';
import { buildDepGraphs, MixJsonResult } from '@snyk/mix-parser';
import * as subProcess from './sub-process';
import { PluginResponse } from './types';
import { debug, init } from './debug';
import { copyElixirCodeToTempDir } from './copy-elixir-code-to-temp-dir';
import { getMixCmd } from './mixCmd';

interface Options {
  debug?: boolean; // true will print out debug messages when using the "--debug" flag
  dev?: boolean; // will include dependencies that are limited to non :prod environments
  allProjects?: boolean; // if true, will not resolve apps if tested manifest is an umbrella project
  projectName?: string; // will be the value of the '--project-name' flag if used.
  path: string;
  targetFile?: string;
  shell?: boolean; // if true, node will spawn child process with { shell: true }
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

  await verifyMixInstalled(options.shell);

  const mixResult = await getMixResult(targetFile.dir, options.shell);

  const depGraphMap = buildDepGraphs(
    mixResult,
    !!options.dev,
    true,
    options.allProjects,
  );
  const scanResults = Object.entries(depGraphMap).map(
    ([name, depGraph], index) => {
      const isRoot = index === 0;
      const relativePathToManifest = getRelativePathToManifest(
        options,
        targetFile,
        isRoot,
        name,
      );
      return {
        identity: {
          type: 'hex',
          targetFile: relativePathToManifest,
        },
        facts: [
          {
            type: 'depGraph',
            data: depGraph,
          },
        ],
        ...(options.projectName
          ? { name: getProjectNamePath(options, relativePathToManifest) }
          : {}),
      };
    },
  );

  return { scanResults };
}

async function verifyMixInstalled(shell = false) {
  try {
    const mixVersion = await subProcess.execute(getMixCmd(shell), ['-v'], {
      shell,
    });
    debug(`mix version: `, mixVersion);
  } catch {
    throw new Error(
      'mix is not installed. please make sure Elixir is installed and try again.',
    );
  }
}

async function getMixResult(
  root: string,
  shell = false,
): Promise<MixJsonResult> {
  const elixirTmpDir = copyElixirCodeToTempDir();
  const cwd = elixirTmpDir.name;

  let filePath: string | undefined;
  try {
    const output = await subProcess.execute(
      getMixCmd(shell),
      ['read.mix', root],
      {
        cwd,
        shell,
      },
    );
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
    try {
      elixirTmpDir.removeCallback();
    } catch (err) {
      debug(`can't remove ${elixirTmpDir.name}`, err);
    }
  }
}

function normalizePath(filePath: string) {
  const parts = filePath.split(path.sep);
  return parts.join(path.posix.sep);
}

function getRelativePathToManifest(
  options: Options,
  targetFile: path.ParsedPath,
  isRoot: boolean,
  name: string,
) {
  return normalizePath(
    path.relative(
      options.path,
      path.resolve(targetFile.dir, isRoot ? '' : name, targetFile.base),
    ),
  );
}

function getProjectNamePath(options: Options, relativePathToManifest: string) {
  return [
    options.projectName,
    ...relativePathToManifest.split('/').slice(0, -1),
  ].join('/');
}
