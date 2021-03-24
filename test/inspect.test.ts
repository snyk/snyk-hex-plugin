import { inspect } from '../lib';
import * as path from 'path';
import { cleanTargetFile } from './utils';
import { InspectResult } from '../lib/inspect';

describe('inspect', () => {
  it('simple fixture', async () => {
    const result = await inspect(
      path.resolve(__dirname, 'fixtures/simple'),
      'mix.exs',
      { dev: true },
    );

    expect(clean(result)).toMatchSnapshot();
  });
});

function clean(result: InspectResult) {
  const {
    plugin: { targetFile, name },
    dependencyGraph,
  } = result;

  return {
    plugin: {
      targetFile: cleanTargetFile(targetFile),
      name,
    },
    dependencyGraph,
  };
}
