import * as path from 'path';
import * as fs from 'fs';
import debugLib = require('debug');
import { buildDepGraph, MixJsonResult } from '@snyk/mix-parser';
import * as subProcess from './sub-process';
import { PluginResponse } from './types';
import { debug } from './debug';

const PLUGIN_NAME = 'snyk-hex-plugin';

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

  const [, , mixResult] = await Promise.all([
    verifyHexInstalled(),
    verifyMixInstalled(root),
    getMixResult(root),
  ]);

  const depGraph = buildDepGraph(mixResult, !!options.dev, true);

  return {
    scanResults: [
      {
        identity: {
          type: 'Hex',
          targetFile: normalizePath(path.resolve(root, targetFile)),
        },
        facts: [
          {
            type: 'depGraph',
            data: depGraph,
          },
        ],
        ...(options.projectName ? { name: options.projectName } : {}),
      },
    ],
  };
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

async function verifyMixInstalled(root: string) {
  const mixVersion = await subProcess.execute('mix', ['-v'], { cwd: root });
  debug(`mix version: `, mixVersion);
}

async function getMixResult(root: string): Promise<MixJsonResult> {
  const cwd = path.join(__dirname, '../elixirsrc');

  const output = await subProcess.execute('mix', ['read.mix', root], { cwd });
  const fileName = output.trim().split('\n').pop();
  if (!fileName) throw new Error('No json file found.');
  const filePath = path.resolve(cwd, fileName);

  try {
    const result = (await fs.promises.readFile(filePath, 'utf8')) as string;
    return JSON.parse(result) as MixJsonResult;
  } finally {
    await fs.promises.unlink(filePath);
  }
}

function normalizePath(filePath: string) {
  const parts = filePath.split(path.sep);
  return parts.join(path.posix.sep);
}
