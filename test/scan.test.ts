import { scan } from '../lib';
import * as path from 'upath';
import { ScanResult } from '../lib/types';
import { cleanTargetFile } from './utils';

describe('scan', () => {
  describe('fixtures', () => {
    verifyFixture('simple');
    verifyFixture('umbrella');
    verifyFixture('regex');
    verifyFixture('simple', { projectName: 'renamed-project' });
    verifyFixture('umbrella', { projectName: 'renamed-project' });
    verifyFixture('regex', { projectName: 'renamed-project' });
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

function verifyFixture(
  fixtureName: string,
  options?: { projectName?: string },
) {
  it(`${fixtureName}${
    options?.projectName ? ' (with projectName)' : ''
  }`, async () => {
    const result = await runFixture(fixtureName, options);

    expect(result.scanResults?.length).toMatchSnapshot('length');

    for (const scanResult of result.scanResults) {
      expect(clean(scanResult)).toMatchSnapshot(
        cleanTargetFile(scanResult.identity.targetFile!),
      );
    }
  });
}

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
