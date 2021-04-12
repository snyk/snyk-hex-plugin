import { inspect } from '../lib';
import * as path from 'upath';
import { cleanTargetFile } from './utils';
import { ScannedProject } from '../lib/inspect';

describe('inspect', () => {
  verifyFixture('simple');
  verifyFixture('umbrella');
  verifyFixture('umbrella/apps/api');
  verifyFixture('umbrella', 'mix.exs', true);
  verifyFixture('umbrella', 'apps/api/mix.exs', true);
});

function verifyFixture(
  fixtureName: string,
  targetFile = 'mix.exs',
  allProjects = false,
) {
  it(`${fixtureName}${targetFile === 'mix.exs' ? '' : '/' + targetFile}${
    allProjects ? ', allProjects = true' : ''
  }`, async () => {
    const result = await inspect(
      path.resolve(__dirname, `fixtures/${fixtureName}`),
      targetFile,
      { dev: true, allProjects },
    );

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
