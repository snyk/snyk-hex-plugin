import { DepGraph } from '@snyk/dep-graph';
import * as subProcess from './sub-process';
import { scan } from './scan';

interface Options {
  debug?: boolean;
  dev?: boolean;
  file?: string;
}

const PLUGIN_NAME = 'snyk-hex-plugin';

export type InspectResult = {
  plugin: { targetFile: string; name: string; runtime: string | undefined };
  dependencyGraph: DepGraph;
};

export async function inspect(
  root: string,
  targetFile: string,
  options: Options = {},
): Promise<InspectResult> {
  const { debug, dev } = options;

  const [scanResults, pluginVersion] = await Promise.all([
    scan({ debug, dev, path: root, targetFile }),
    getPluginVersion(),
  ]);

  const {
    scanResults: [
      {
        identity,
        facts: [{ data: depGraph }],
      },
    ],
  } = scanResults;

  return {
    plugin: {
      targetFile: identity.targetFile!,
      name: PLUGIN_NAME,
      runtime: pluginVersion,
    },
    dependencyGraph: depGraph,
  };
}

async function getPluginVersion() {
  const output = await subProcess.execute('mix', ['-v']);
  const versionMatch = /(Mix\s\d+\.\d+\.\d*)/.exec(output);
  return versionMatch ? versionMatch[0] : 'Unknown version';
}
