import * as path from 'path';
import * as fs from 'fs';
import debugLib = require('debug');
import { buildDepGraph, ElixirJsonResult } from '@snyk/snyk-elixir-parser';
import * as subProcess from './sub-process';
import { PluginResponse } from './types';

const PLUGIN_NAME = 'snyk-elixir-plugin';

interface Options {
  debug?: boolean; // true will print out debug messages when using the "--debug" flag
  dev?: boolean; // will include dependencies that are limited to non :prod environments
  projectName?: string; // will be the value of the '--project-name' flag if used.
}

export async function scan(
  root: string,
  targetFile = 'mix.exs',
  options: Options = {},
): Promise<PluginResponse> {
  options.debug ? debugLib.enable(PLUGIN_NAME) : debugLib.disable();

  const [, pluginMetadata, elixirResult] = await Promise.all([
    verifyHexInstalled(),
    getPluginMetaData(root, targetFile),
    getElixirResult(root),
  ]);

  const depGraph = buildDepGraph(elixirResult, !!options.dev, true);

  return {
    scanResults: [
      {
        identity: {
          type: 'Hex',
          targetFile: pluginMetadata.targetFile,
        },
        facts: [
          {
            type: 'depGraph',
            data: depGraph,
          },
        ],
        name: options.projectName,
      },
    ],
  };
}

async function verifyHexInstalled() {
  try {
    await subProcess.execute('mix', ['hex.info']);
  } catch (err) {
    throw new Error(
      'hex is not installed. please run `mix local.hex` and try again.',
    );
  }
}

async function getPluginMetaData(root: string, targetFile: string) {
  const output = await subProcess.execute('mix', ['-v'], { cwd: root });
  const versionMatch = /(Mix\s\d+\.\d+\.\d*)/.exec(output);
  const runtime = versionMatch ? versionMatch[0] : 'Unknown version';

  return {
    name: PLUGIN_NAME,
    runtime,
    targetFile: pathToPosix(targetFile),
  };
}

async function getElixirResult(root: string): Promise<ElixirJsonResult> {
  const cwd = path.join(__dirname, '../elixirsrc');

  const output = await subProcess.execute('mix', ['read.mix', root], { cwd });
  const fileName = output.trim().split('\n').pop();
  if (!fileName) throw new Error('No json file found.');
  const filePath = path.resolve(cwd, fileName);

  try {
    const result = (await fs.promises.readFile(filePath, 'utf8')) as string;
    return JSON.parse(result) as ElixirJsonResult;
  } finally {
    await fs.promises.unlink(filePath);
  }
}

function pathToPosix(filePath: string) {
  const parts = filePath.split(path.sep);
  return parts.join(path.posix.sep);
}
