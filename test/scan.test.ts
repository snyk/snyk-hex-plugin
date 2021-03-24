import { scan } from '../lib';
import * as path from 'path';
import { ScanResult } from '../lib/types';
import { cleanTargetFile } from './utils';

describe('scan', () => {
  it('simple fixture works', async () => {
    const result = await runFixture('simple');

    expect(clean(result.scanResults[0])).toMatchSnapshot();
  });

  it('broken manifest file throws', async () => {
    expect(() => runFixture('bad-manifest')).rejects.toThrow(
      /Error parsing manifest file/,
    );
  });

  it('non existing folder throws', async () => {
    expect(() => runFixture('bad-manifest')).rejects.toThrow(
      /Error parsing manifest file/,
    );
  });

  it('invalid targetFile throws', async () => {
    expect(() =>
      runFixture('simple', {
        targetFile: 'mix1.exs',
      }),
    ).rejects.toThrow(/mix\.exs/);
  });
});

function runFixture(fixtureName: string, options?: any) {
  return scan({
    dev: true,
    path: path.resolve(__dirname, 'fixtures', fixtureName),
    ...options,
  });
}

function clean(scanResult: ScanResult) {
  const { identity, ...props } = scanResult;

  return {
    identify: {
      ...identity,
      targetFile: cleanTargetFile(identity.targetFile!),
    },
    ...props,
  };
}
