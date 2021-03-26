import { DepGraph } from '@snyk/dep-graph';
import * as subProcess from './sub-process';
import { scan } from './scan';

interface Options {
  debug?: boolean;
  dev?: boolean;
  file?: string;
}

const PLUGIN_NAME = 'snyk-hex-plugin';

export interface MultiProjectResult {
  plugin: { name: string; runtime: string | undefined };
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
  const { debug, dev } = options;

  const [scanResult, pluginVersion] = await Promise.all([
    scan({ debug, dev, path: root, targetFile }),
    getPluginVersion(),
  ]);

  const scannedProjects = scanResult.scanResults.map(
    ({ identity, facts: [{ data: depGraph }] }) => ({
      packageManager: 'hex',
      targetFile: identity.targetFile!,
      depGraph,
    }),
  );

  return {
    plugin: {
      name: PLUGIN_NAME,
      runtime: pluginVersion,
    },
    scannedProjects,
  };
}

async function getPluginVersion() {
  const output = await subProcess.execute('mix', ['-v']);
  const versionMatch = /(Mix\s\d+\.\d+\.\d*)/.exec(output);
  return versionMatch ? versionMatch[0] : 'Unknown version';
}
