import { scan } from '../lib';
import * as path from 'path';
import { ScanResult } from '../lib/types';

describe('scan', () => {
  it('simple fixture', async () => {
    const result = await scan(
      path.resolve(__dirname, 'fixtures/simple'),
      'mix.exs',
      { dev: true },
    );

    expect(clean(result.scanResults[0])).toMatchSnapshot();
  });
});

function clean(scanResult: ScanResult) {
  const { identity, ...props } = scanResult;

  return {
    identify: {
      ...identity,
      args: { ...identity.args, runtime: undefined },
    },
    ...props,
  };
}
