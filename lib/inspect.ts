import { DepGraph } from '@snyk/dep-graph';
import * as subProcess from './sub-process';
import { scan } from './scan';
import { getMixCmd } from './mixCmd';

interface Options {
  debug?: boolean;
  dev?: boolean;
  file?: string;
  'project-name'?: string;
  allProjects?: boolean; // if true, will not resolve apps if tested manifest is an umbrella project
  'enable-shell'?: boolean; // if true, node will spawn child process with { shell: true }
}

const PLUGIN_NAME = 'snyk-hex-plugin';

export interface MultiProjectResult {
  plugin: { name: string; runtime: string | undefined; targetFile: string };
  scannedProjects: ScannedProject[];
}

export interface ScannedProject {
  packageManager: string;
  depGraph?: DepGraph;
  targetFile: string;
  meta?: any;
}

export async function inspect(
  root: string,
  targetFile: string,
  options: Options = {},
): Promise<MultiProjectResult> {
  const {
    debug,
    dev,
    allProjects,
    'project-name': projectName,
    'enable-shell': shell,
  } = options;

  const [scanResult, pluginVersion] = await Promise.all([
    scan({
      debug,
      dev,
      allProjects,
      projectName,
      path: root,
      targetFile,
      shell,
    }),
    getPluginVersion(shell),
  ]);

  const scannedProjects = scanResult.scanResults.map(
    ({ identity, facts: [{ data: depGraph }], name }) => ({
      packageManager: 'hex',
      targetFile: identity.targetFile!,
      depGraph,
      ...(name ? { meta: { projectName: name } } : {}),
    }),
  );

  return {
    plugin: {
      name: PLUGIN_NAME,
      runtime: pluginVersion,
      targetFile: 'mix.exs',
    },
    scannedProjects,
  };
}

async function getPluginVersion(shell = false) {
  const output = await subProcess.execute(getMixCmd(shell), ['-v'], {
    shell,
  });
  const versionMatch = /(Mix\s\d+\.\d+\.\d*)/.exec(output);
  return versionMatch ? versionMatch[0] : 'Unknown version';
}
