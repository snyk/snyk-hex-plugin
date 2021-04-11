import { inspect } from '../lib';
import * as path from 'path';
import { cleanTargetFile } from './utils';
import { ScannedProject } from '../lib/inspect';

describe('inspect', () => {
  verifyFixture('simple');
  verifyFixture('umbrella');
  verifyFixture('umbrella/apps/api');
});

function verifyFixture(fixtureName: string) {
  it(fixtureName, async () => {
    const result = await inspect(
      path.resolve(__dirname, `fixtures/${fixtureName}`),
      'mix.exs',
      { dev: true },
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      plugin: { runtime, ...plugin },
      scannedProjects,
    } = result;

    expect(plugin).toMatchSnapshot('plugin');
    expect(scannedProjects?.length).toMatchSnapshot('length');

    for (const scannedProject of scannedProjects) {
      expect(clean(scannedProject)).toMatchSnapshot(
        cleanTargetFile(scannedProject.targetFile),
      );
    }
  });
}

function clean(scannedProject: ScannedProject) {
  return {
    ...scannedProject,
    targetFile: cleanTargetFile(scannedProject.targetFile!),
  };
}
